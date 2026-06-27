import pool from "../config/db.js";
import {
  fetchTransactionPaid,
  isMatchingAmount,
  verifyPayFastSignature,
} from "../services/payfastService.js";
import { logActivity } from "../services/activityLog.js";
import {
  createNotification,
  notifyAdmins,
} from "../services/notificationService.js";
import { sendCollectionReadyEmail } from "../services/emailService.js";

const markOrderPaid = async ({ orderReference, providerPaymentId, rawPayload }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, user_id, order_reference, status
       FROM collection_orders
       WHERE order_reference = $1
       FOR UPDATE`,
      [orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const order = orderResult.rows[0];

    // Only a still-pending order may transition to paid. This guards against
    // a duplicate ITN (idempotency) and against a late confirmation arriving
    // after the order was already cancelled or expired and its items released.
    if (order.status !== "payment_pending") {
      await client.query("ROLLBACK");

      if (
        order.status === "ready_for_collection" ||
        order.status === "paid"
      ) {
        // Already confirmed — treat the repeat notification as a success.
        return order;
      }

      // Payment landed for an order we already released. The funds may have
      // been captured, so flag it for manual refund rather than reviving it.
      console.warn(
        `PayFast confirmed payment for ${order.order_reference} but its status is '${order.status}'. Manual refund may be required.`,
      );
      return { ...order, requiresRefund: true };
    }

    await client.query(
      `UPDATE payments
       SET status = 'paid',
           provider_payment_id = COALESCE($1, provider_payment_id),
           paid_at = now(),
           raw_webhook_payload = COALESCE($2, raw_webhook_payload)
       WHERE collection_order_id = $3`,
      [providerPaymentId || null, rawPayload || null, order.id],
    );

    await client.query(
      `UPDATE collection_orders
       SET status = 'ready_for_collection',
           email_sent_at = now()
       WHERE id = $1`,
      [order.id],
    );

    const itemResult = await client.query(
      `UPDATE collection_order_items
       SET item_status = 'reserved'
       WHERE collection_order_id = $1
       RETURNING product_id`,
      [order.id],
    );

    await client.query(
      "UPDATE products SET status = 'Reserved' WHERE id = ANY($1::uuid[])",
      [itemResult.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    logActivity({
      action: "order.paid",
      actorId: order.user_id,
      entityType: "order",
      entityId: order.id,
      entityRef: order.order_reference,
      description: `Payment received for ${order.order_reference}`,
    });

    createNotification({
      userId: order.user_id,
      type: "order_ready",
      title: "Your order is ready to collect",
      body: `Payment confirmed for ${order.order_reference}. Present your reference at the school to collect your item.`,
      entityType: "order",
      entityRef: order.order_reference,
      link: "/orders",
    });

    // Notify the buyer their order is paid and ready to collect (graceful).
    try {
      const detail = await pool.query(
        `SELECT co.order_reference, co.user_email, co.user_full_name,
                i.institution_name
         FROM collection_orders co
         JOIN institutions i ON i.id = co.institution_id
         WHERE co.id = $1`,
        [order.id],
      );
      const items = await pool.query(
        `SELECT product_name, product_reference_number
         FROM collection_order_items WHERE collection_order_id = $1`,
        [order.id],
      );
      if (detail.rows[0]) {
        sendCollectionReadyEmail({ ...detail.rows[0], items: items.rows });
      }
    } catch (mailError) {
      console.error(
        `[email] could not send collection-ready email: ${mailError.message}`,
      );
    }

    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const markOrderPaymentFailed = async ({
  orderReference,
  providerPaymentId,
  rawPayload,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, user_id, order_reference
       FROM collection_orders
       WHERE order_reference = $1
       FOR UPDATE`,
      [orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const order = orderResult.rows[0];

    const failureReason = rawPayload?.payment_status
      ? `PayFast payment_status=${rawPayload.payment_status}`
      : null;

    await client.query(
      `UPDATE payments
       SET status = 'failed',
           provider_payment_id = COALESCE($1, provider_payment_id),
           failed_at = now(),
           failure_reason = COALESCE($2, failure_reason),
           raw_webhook_payload = COALESCE($3, raw_webhook_payload)
       WHERE collection_order_id = $4`,
      [providerPaymentId || null, failureReason, rawPayload || null, order.id],
    );

    await client.query(
      `UPDATE collection_orders
       SET status = 'payment_failed'
       WHERE id = $1`,
      [order.id],
    );

    const itemResult = await client.query(
      `UPDATE collection_order_items
       SET item_status = 'cancelled'
       WHERE collection_order_id = $1
       RETURNING product_id`,
      [order.id],
    );

    await client.query(
      "UPDATE products SET status = 'Available' WHERE id = ANY($1::uuid[])",
      [itemResult.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    createNotification({
      userId: order.user_id,
      type: "payment_failed",
      title: "Payment failed",
      body: `Your payment for ${order.order_reference} did not go through. You can try paying again from your orders.`,
      entityType: "order",
      entityRef: order.order_reference,
      link: "/orders",
    });

    notifyAdmins({
      type: "payment_failed",
      title: "A payment failed",
      body: `Payment for ${order.order_reference} failed and the items were released.`,
      entityType: "order",
      entityRef: order.order_reference,
      link: "/admin/payments",
    });

    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Reverts a still-pending checkout: cancels the order and its reserved items
// and returns the held products to "Available". Used for both explicit user
// cancellations and the automatic expiry sweep. Orders that have already moved
// past "payment_pending" (paid, cancelled, expired) are left untouched.
const releaseCollectionOrder = async ({
  orderReference,
  userId = null,
  toStatus = "cancelled",
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, user_id, status
       FROM collection_orders
       WHERE order_reference = $1
       FOR UPDATE`,
      [orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { released: false, reason: "not_found" };
    }

    const order = orderResult.rows[0];

    if (userId && order.user_id !== userId) {
      await client.query("ROLLBACK");
      return { released: false, reason: "forbidden" };
    }

    if (order.status !== "payment_pending") {
      await client.query("ROLLBACK");
      return { released: false, reason: "not_pending", status: order.status };
    }

    await client.query(
      `UPDATE payments
       SET status = 'cancelled'
       WHERE collection_order_id = $1
         AND status = 'pending'`,
      [order.id],
    );

    await client.query(
      `UPDATE collection_orders
       SET status = $2
       WHERE id = $1`,
      [order.id, toStatus],
    );

    const itemResult = await client.query(
      `UPDATE collection_order_items
       SET item_status = 'cancelled'
       WHERE collection_order_id = $1
       RETURNING product_id`,
      [order.id],
    );

    const productIds = itemResult.rows
      .map((row) => row.product_id)
      .filter(Boolean);

    // Only release products we are actually holding for this checkout. The
    // "status = 'Pending'" guard avoids clobbering an item that has since been
    // reserved or sold through another order.
    await client.query(
      `UPDATE products
       SET status = 'Available'
       WHERE id = ANY($1::uuid[])
         AND status = 'Pending'`,
      [productIds],
    );

    await client.query("COMMIT");

    logActivity({
      action: toStatus === "expired" ? "order.expired" : "order.cancelled",
      actorId: order.user_id,
      entityType: "order",
      entityId: order.id,
      entityRef: orderReference,
      description: `Order ${orderReference} ${toStatus}`,
    });

    return { released: true, status: toStatus, productIds };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Releases every pending order whose hold has expired. Safe to call before any
// availability-sensitive operation, or from a scheduled job.
const releaseExpiredOrders = async () => {
  const expiredResult = await pool.query(
    `SELECT order_reference
     FROM collection_orders
     WHERE status = 'payment_pending'
       AND expires_at IS NOT NULL
       AND expires_at < now()`,
  );

  let releasedCount = 0;

  for (const row of expiredResult.rows) {
    const result = await releaseCollectionOrder({
      orderReference: row.order_reference,
      toStatus: "expired",
    });

    if (result.released) {
      releasedCount += 1;
    }
  }

  return releasedCount;
};

const getPaymentForOrder = async (orderReference) => {
  const result = await pool.query(
    `SELECT
       co.id AS order_id,
       co.order_reference,
       p.amount::text AS amount,
       p.currency,
       p.status AS payment_status
     FROM collection_orders co
     JOIN payments p ON p.collection_order_id = co.id
     WHERE co.order_reference = $1
     LIMIT 1`,
    [orderReference],
  );

  return result.rows[0] || null;
};

const confirmPayment = async (req, res) => {
  if (process.env.ALLOW_MANUAL_PAYMENT_CONFIRMATION !== "true") {
    return res.status(403).json({
      message:
        "Manual payment confirmation is disabled. Payments must be confirmed by PayFast ITN.",
    });
  }

  try {
    const order = await markOrderPaid({
      orderReference: req.body.order_reference,
      providerPaymentId: req.body.provider_payment_id,
      rawPayload: req.body,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      message: "Payment confirmed",
      order_reference: order.order_reference,
      status: "ready_for_collection",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Payment confirmation failed", error: error.message });
  }
};

const payfastItn = async (req, res) => {
  try {
    const payload = req.body || {};
    const orderReference = payload.m_payment_id;

    console.log(
      `[PayFast ITN] received for ${orderReference || "(no m_payment_id)"} — status=${payload.payment_status}`,
    );

    if (!orderReference) {
      console.warn("[PayFast ITN] rejected: missing m_payment_id");
      return res.status(400).send("Missing m_payment_id");
    }

    if (!verifyPayFastSignature(payload)) {
      console.warn(`[PayFast ITN] rejected: invalid signature for ${orderReference}`);
      return res.status(400).send("Invalid PayFast signature");
    }

    const payment = await getPaymentForOrder(orderReference);

    if (!payment) {
      console.warn(`[PayFast ITN] rejected: order ${orderReference} not found`);
      return res.status(404).send("Order not found");
    }

    if (!isMatchingAmount(payment.amount, payload.amount_gross)) {
      console.warn(
        `[PayFast ITN] rejected: amount mismatch for ${orderReference} (expected ${payment.amount}, got ${payload.amount_gross})`,
      );
      return res.status(400).send("Payment amount mismatch");
    }

    if (payload.payment_status !== "COMPLETE") {
      await markOrderPaymentFailed({
        orderReference,
        providerPaymentId: payload.pf_payment_id,
        rawPayload: payload,
      });

      console.log(
        `[PayFast ITN] ${orderReference} marked payment_failed (status=${payload.payment_status})`,
      );
      return res.status(200).send("OK");
    }

    await markOrderPaid({
      orderReference,
      providerPaymentId: payload.pf_payment_id,
      rawPayload: payload,
    });

    console.log(`[PayFast ITN] ${orderReference} marked paid → ready_for_collection`);
    return res.status(200).send("OK");
  } catch (error) {
    console.error(`[PayFast ITN] error: ${error.message}`);
    return res.status(500).send(error.message);
  }
};

const paymentWebhook = async (_req, res) => {
  return res.status(410).json({
    message:
      "Generic payment webhooks are disabled. Use /api/payments/payfast/itn for PayFast.",
  });
};

// POST /api/payments/:orderReference/reconcile — buyer-triggered fallback when
// the ITN is slow/lost. Asks PayFast directly whether the payment processed and,
// if so, confirms the order (idempotent). Safe no-op otherwise.
const reconcileOrder = async (req, res) => {
  try {
    const orderResult = await pool.query(
      `SELECT order_reference, status, created_at, total::text AS total
       FROM collection_orders
       WHERE order_reference = $1 AND user_id = $2`,
      [req.params.orderReference, req.user.id],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Already resolved (paid/cancelled/expired/…) — nothing to reconcile.
    if (order.status !== "payment_pending") {
      return res.json({ status: order.status, reconciled: false });
    }

    const paid = await fetchTransactionPaid(
      order.order_reference,
      order.created_at,
      order.total,
    );

    if (!paid) {
      return res.json({ status: order.status, reconciled: false });
    }

    await markOrderPaid({
      orderReference: order.order_reference,
      providerPaymentId: "reconciled",
      rawPayload: { reconciled: true },
    });

    return res.json({ status: "ready_for_collection", reconciled: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Reconcile failed", error: error.message });
  }
};

export {
  confirmPayment,
  markOrderPaid,
  markOrderPaymentFailed,
  payfastItn,
  paymentWebhook,
  reconcileOrder,
  releaseCollectionOrder,
  releaseExpiredOrders,
};
