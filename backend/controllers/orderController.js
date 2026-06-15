import pool from "../config/db.js";

// Shapes a collection_orders row (joined with institution + payment) into the
// response object the frontend "My orders" page consumes.
const serializeOrder = (row, items) => ({
  order_reference: row.order_reference,
  status: row.status,
  created_at: row.created_at,
  expires_at: row.expires_at,
  collection_note: row.collection_note,
  institution_name: row.institution_name,
  subtotal: row.subtotal,
  service_fee: row.service_fee,
  total: row.total,
  payment: {
    status: row.payment_status,
    method: row.payment_method,
    amount: row.payment_amount,
    currency: row.currency,
    paid_at: row.paid_at,
  },
  items,
});

const ORDER_SELECT = `
  SELECT
    co.id,
    co.order_reference,
    co.status,
    co.created_at,
    co.expires_at,
    co.collection_note,
    co.subtotal::text AS subtotal,
    co.service_fee::text AS service_fee,
    co.total::text AS total,
    i.institution_name,
    p.status AS payment_status,
    p.payment_method,
    p.amount::text AS payment_amount,
    p.currency,
    p.paid_at
  FROM collection_orders co
  JOIN institutions i ON i.id = co.institution_id
  LEFT JOIN payments p ON p.collection_order_id = co.id`;

const getOrderItems = async (orderIds) => {
  if (orderIds.length === 0) return new Map();

  const result = await pool.query(
    `SELECT
      it.collection_order_id,
      it.product_name,
      it.product_reference_number,
      it.listing_type,
      it.institution_name,
      it.unit_price::text AS unit_price,
      it.item_status,
      (
        SELECT image_url
        FROM product_images pi
        WHERE pi.product_id = it.product_id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS image
     FROM collection_order_items it
     WHERE it.collection_order_id = ANY($1::uuid[])
     ORDER BY it.created_at ASC`,
    [orderIds],
  );

  const byOrder = new Map();
  for (const item of result.rows) {
    const list = byOrder.get(item.collection_order_id) || [];
    list.push({
      product_name: item.product_name,
      reference_number: item.product_reference_number,
      listing_type: item.listing_type,
      institution_name: item.institution_name,
      unit_price: item.unit_price,
      item_status: item.item_status,
      image: item.image,
    });
    byOrder.set(item.collection_order_id, list);
  }

  return byOrder;
};

// GET /api/orders — the signed-in user's collection orders, newest first.
const listMyOrders = async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `${ORDER_SELECT}
       WHERE co.user_id = $1
       ORDER BY co.created_at DESC`,
      [req.user.id],
    );

    const itemsByOrder = await getOrderItems(
      ordersResult.rows.map((row) => row.id),
    );

    const orders = ordersResult.rows.map((row) =>
      serializeOrder(row, itemsByOrder.get(row.id) || []),
    );

    return res.json({ orders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

// GET /api/orders/:orderReference — a single order owned by the signed-in user.
const getMyOrder = async (req, res) => {
  try {
    const orderResult = await pool.query(
      `${ORDER_SELECT}
       WHERE co.user_id = $1 AND co.order_reference = $2`,
      [req.user.id, req.params.orderReference],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemsByOrder = await getOrderItems([orderResult.rows[0].id]);
    const order = serializeOrder(
      orderResult.rows[0],
      itemsByOrder.get(orderResult.rows[0].id) || [],
    );

    return res.json({ order });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch order", error: error.message });
  }
};

export { getMyOrder, listMyOrders };
