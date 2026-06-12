import pool from "../config/db.js";
import {
  isMatchingAmount,
  verifyPayFastSignature,
} from "../services/payfastService.js";

const markOrderPaid = async ({ orderReference, providerPaymentId, rawPayload }) => {
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
      `SELECT id, order_reference
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

    await client.query(
      `UPDATE payments
       SET status = 'failed',
           provider_payment_id = COALESCE($1, provider_payment_id),
           failed_at = now(),
           raw_webhook_payload = COALESCE($2, raw_webhook_payload)
       WHERE collection_order_id = $3`,
      [providerPaymentId || null, rawPayload || null, order.id],
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

    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
    const payload = req.body;
    const orderReference = payload.m_payment_id;

    if (!orderReference) {
      return res.status(400).send("Missing m_payment_id");
    }

    if (!verifyPayFastSignature(payload)) {
      return res.status(400).send("Invalid PayFast signature");
    }

    const payment = await getPaymentForOrder(orderReference);

    if (!payment) {
      return res.status(404).send("Order not found");
    }

    if (!isMatchingAmount(payment.amount, payload.amount_gross)) {
      return res.status(400).send("Payment amount mismatch");
    }

    if (payload.payment_status !== "COMPLETE") {
      await markOrderPaymentFailed({
        orderReference,
        providerPaymentId: payload.pf_payment_id,
        rawPayload: payload,
      });

      return res.status(200).send("OK");
    }

    await markOrderPaid({
      orderReference,
      providerPaymentId: payload.pf_payment_id,
      rawPayload: payload,
    });

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const paymentWebhook = async (_req, res) => {
  return res.status(410).json({
    message:
      "Generic payment webhooks are disabled. Use /api/payments/payfast/itn for PayFast.",
  });
};

export {
  confirmPayment,
  markOrderPaid,
  markOrderPaymentFailed,
  payfastItn,
  paymentWebhook,
};
