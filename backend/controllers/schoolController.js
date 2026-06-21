import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";

// Every query here is scoped to the authenticated staff member's institution,
// so a school only ever sees and acts on its own collections.

const fetchScopedOrder = async (institutionId, orderReference) => {
  const orderResult = await pool.query(
    `SELECT
      co.id,
      co.order_reference,
      co.status,
      co.user_full_name,
      co.user_email,
      co.collection_note,
      co.total::text AS total,
      co.created_at,
      i.institution_name,
      p.status AS payment_status
     FROM collection_orders co
     JOIN institutions i ON i.id = co.institution_id
     LEFT JOIN payments p ON p.collection_order_id = co.id
     WHERE co.institution_id = $1 AND co.order_reference = $2`,
    [institutionId, orderReference],
  );

  if (orderResult.rows.length === 0) return null;

  const itemsResult = await pool.query(
    `SELECT
      id,
      product_name,
      product_reference_number,
      listing_type,
      unit_price::text AS unit_price,
      item_status
     FROM collection_order_items
     WHERE collection_order_id = $1
     ORDER BY created_at ASC`,
    [orderResult.rows[0].id],
  );

  return { ...orderResult.rows[0], items: itemsResult.rows };
};

// GET /api/school/dashboard — at-a-glance counts for this school's collection desk.
const getDashboardStats = async (req, res) => {
  try {
    const institutionId = req.user.institution_id;

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status IN ('ready_for_collection', 'paid')) AS ready_count,
        COALESCE(
          SUM(total) FILTER (WHERE status IN ('ready_for_collection', 'paid')),
          0
        )::text AS ready_value,
        COUNT(*) FILTER (
          WHERE status = 'collected' AND collected_at::date = CURRENT_DATE
        ) AS collected_today,
        COUNT(*) FILTER (WHERE status = 'collected') AS collected_total
       FROM collection_orders
       WHERE institution_id = $1`,
      [institutionId],
    );

    const recentResult = await pool.query(
      `SELECT order_reference, user_full_name, total::text AS total, collected_at
       FROM collection_orders
       WHERE institution_id = $1 AND status = 'collected'
       ORDER BY collected_at DESC NULLS LAST
       LIMIT 5`,
      [institutionId],
    );

    const row = statsResult.rows[0];

    return res.json({
      stats: {
        ready_count: Number(row.ready_count),
        ready_value: row.ready_value,
        collected_today: Number(row.collected_today),
        collected_total: Number(row.collected_total),
      },
      recent: recentResult.rows,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load dashboard", error: error.message });
  }
};

// GET /api/school/orders?status= — this school's orders, newest first.
const listSchoolOrders = async (req, res) => {
  try {
    const values = [req.user.institution_id];
    let where = "co.institution_id = $1";

    if (req.query.status) {
      values.push(req.query.status);
      where += ` AND co.status = $${values.length}`;
    }

    const result = await pool.query(
      `SELECT
        co.id,
        co.order_reference,
        co.status,
        co.user_full_name,
        co.user_email,
        co.total::text AS total,
        co.created_at,
        p.status AS payment_status
       FROM collection_orders co
       LEFT JOIN payments p ON p.collection_order_id = co.id
       WHERE ${where}
       ORDER BY co.created_at DESC`,
      values,
    );

    return res.json({ orders: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

// GET /api/school/lookup?reference= — find an order by its order reference
// (ORD-…) or by any item reference (ITEM-…) the buyer presents.
const lookupByReference = async (req, res) => {
  try {
    const reference = String(req.query.reference || "").trim();

    if (!reference) {
      return res.status(400).json({ message: "Reference is required" });
    }

    const institutionId = req.user.institution_id;

    const byOrder = await pool.query(
      `SELECT order_reference
       FROM collection_orders
       WHERE institution_id = $1 AND order_reference = $2`,
      [institutionId, reference],
    );

    let orderReference = byOrder.rows[0]?.order_reference || null;

    if (!orderReference) {
      const byItem = await pool.query(
        `SELECT co.order_reference
         FROM collection_order_items it
         JOIN collection_orders co ON co.id = it.collection_order_id
         WHERE co.institution_id = $1 AND it.product_reference_number = $2`,
        [institutionId, reference],
      );
      orderReference = byItem.rows[0]?.order_reference || null;
    }

    if (!orderReference) {
      return res
        .status(404)
        .json({ message: "No order found for that reference" });
    }

    const order = await fetchScopedOrder(institutionId, orderReference);
    return res.json({ order });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lookup failed", error: error.message });
  }
};

// PATCH /api/school/orders/:orderReference/collect — hand the items over.
const markCollected = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, status
       FROM collection_orders
       WHERE institution_id = $1 AND order_reference = $2
       FOR UPDATE`,
      [req.user.institution_id, req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!["ready_for_collection", "paid"].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `Order is ${order.status} and cannot be collected`,
      });
    }

    await client.query(
      `UPDATE collection_orders
       SET status = 'collected', collected_at = now()
       WHERE id = $1`,
      [order.id],
    );

    const items = await client.query(
      `UPDATE collection_order_items
       SET item_status = 'collected', collected_at = now()
       WHERE collection_order_id = $1
       RETURNING product_id`,
      [order.id],
    );

    await client.query(
      "UPDATE products SET status = 'Claimed' WHERE id = ANY($1::uuid[])",
      [items.rows.map((row) => row.product_id).filter(Boolean)],
    );

    await client.query("COMMIT");

    logActivity({
      action: "order.collected",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: req.user.institution_id,
      entityType: "order",
      entityRef: req.params.orderReference,
      description: `Order ${req.params.orderReference} collected`,
    });

    return res.json({
      message: "Order marked as collected",
      order_reference: req.params.orderReference,
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

export { getDashboardStats, listSchoolOrders, lookupByReference, markCollected };
