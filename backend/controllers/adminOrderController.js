import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";

const listOrders = async (req, res) => {
  try {
    const values = [];
    const conditions = [];

    if (req.query.q) {
      values.push(`%${req.query.q}%`);
      conditions.push(
        `(co.order_reference ILIKE $${values.length} OR co.user_full_name ILIKE $${values.length} OR co.user_email ILIKE $${values.length})`,
      );
    }
    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`co.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM collection_orders co ${where}`,
      values,
    );

    const listValues = [...values];
    let listQuery = `SELECT
        co.id,
        co.order_reference,
        co.status,
        co.user_full_name,
        co.user_email,
        co.total::text AS total,
        co.created_at,
        i.institution_name,
        p.status AS payment_status,
        p.payment_method
       FROM collection_orders co
       JOIN institutions i ON i.id = co.institution_id
       LEFT JOIN payments p ON p.collection_order_id = co.id
       ${where}
       ORDER BY co.created_at DESC`;
    const limit = Number(req.query.limit);
    if (limit) {
      listValues.push(limit);
      listQuery += ` LIMIT $${listValues.length}`;
      listValues.push(Number(req.query.offset) || 0);
      listQuery += ` OFFSET $${listValues.length}`;
    }

    const result = await pool.query(listQuery, listValues);
    return res.json({ orders: result.rows, total: totalResult.rows[0].total });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const orderResult = await pool.query(
      `SELECT
        co.*,
        i.institution_name,
        p.status AS payment_status,
        p.payment_method,
        p.amount::text AS payment_amount,
        p.currency,
        p.paid_at
       FROM collection_orders co
       JOIN institutions i ON i.id = co.institution_id
       LEFT JOIN payments p ON p.collection_order_id = co.id
       WHERE co.order_reference = $1`,
      [req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemsResult = await pool.query(
      `SELECT *
       FROM collection_order_items
       WHERE collection_order_id = $1
       ORDER BY created_at ASC`,
      [orderResult.rows[0].id],
    );

    return res.json({
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch order", error: error.message });
  }
};

const markCollected = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `UPDATE collection_orders
       SET status = 'collected',
           collected_at = now()
       WHERE order_reference = $1
       RETURNING id, order_reference`,
      [req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];
    const itemsResult = await client.query(
      `UPDATE collection_order_items
       SET item_status = 'collected',
           collected_at = now()
       WHERE collection_order_id = $1
       RETURNING product_id`,
      [order.id],
    );

    await client.query(
      "UPDATE products SET status = 'Claimed' WHERE id = ANY($1::uuid[])",
      [itemsResult.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    logActivity({
      action: "order.collected",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "order",
      entityRef: order.order_reference,
      description: `Order ${order.order_reference} marked collected`,
    });

    return res.json({
      message: "Order marked as collected",
      order_reference: order.order_reference,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Failed to mark collected", error: error.message });
  } finally {
    client.release();
  }
};

// POST /api/admin/orders/:orderReference/cancel — cancel an order that hasn't
// been collected, releasing any held products back to the store.
const cancelOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, status FROM collection_orders
       WHERE order_reference = $1 FOR UPDATE`,
      [req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (order.status === "collected") {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "A collected order cannot be cancelled" });
    }
    if (["cancelled", "expired"].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: `Order is already ${order.status}` });
    }

    await client.query(
      "UPDATE collection_orders SET status = 'cancelled' WHERE id = $1",
      [order.id],
    );
    await client.query(
      "UPDATE payments SET status = 'cancelled' WHERE collection_order_id = $1 AND status = 'pending'",
      [order.id],
    );
    const items = await client.query(
      `UPDATE collection_order_items SET item_status = 'cancelled'
       WHERE collection_order_id = $1 RETURNING product_id`,
      [order.id],
    );
    await client.query(
      `UPDATE products SET status = 'Available'
       WHERE id = ANY($1::uuid[]) AND status IN ('Pending', 'Reserved')`,
      [items.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    logActivity({
      action: "order.cancelled",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "order",
      entityRef: req.params.orderReference,
      description: `Order ${req.params.orderReference} cancelled by admin`,
    });

    return res.json({
      message: "Order cancelled and items released",
      order_reference: req.params.orderReference,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Failed to cancel order", error: error.message });
  } finally {
    client.release();
  }
};

// POST /api/admin/orders/:orderReference/refund — refund a paid, uncollected
// order: mark the payment refunded, release the items, cancel the order. The
// actual money movement is processed in the PayFast dashboard.
const refundOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT co.id, co.status, p.status AS payment_status
       FROM collection_orders co
       LEFT JOIN payments p ON p.collection_order_id = co.id
       WHERE co.order_reference = $1 FOR UPDATE OF co`,
      [req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (order.payment_status !== "paid") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Only paid orders can be refunded" });
    }
    if (order.status === "collected") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Order was already collected; handle this as a manual dispute",
      });
    }

    await client.query(
      "UPDATE payments SET status = 'refunded' WHERE collection_order_id = $1",
      [order.id],
    );
    await client.query(
      "UPDATE collection_orders SET status = 'cancelled' WHERE id = $1",
      [order.id],
    );
    const items = await client.query(
      `UPDATE collection_order_items SET item_status = 'cancelled'
       WHERE collection_order_id = $1 RETURNING product_id`,
      [order.id],
    );
    await client.query(
      `UPDATE products SET status = 'Available'
       WHERE id = ANY($1::uuid[]) AND status IN ('Pending', 'Reserved')`,
      [items.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    logActivity({
      action: "order.refunded",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "order",
      entityRef: req.params.orderReference,
      description: `Order ${req.params.orderReference} refunded by admin`,
    });

    return res.json({
      message:
        "Order refunded and items released. Process the money refund in PayFast.",
      order_reference: req.params.orderReference,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Failed to refund order", error: error.message });
  } finally {
    client.release();
  }
};

export { cancelOrder, getOrder, listOrders, markCollected, refundOrder };
