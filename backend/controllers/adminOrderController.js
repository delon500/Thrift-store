import pool from "../config/db.js";

const listOrders = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
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
       ORDER BY co.created_at DESC`,
    );

    return res.json(result.rows);
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

export { getOrder, listOrders, markCollected };
