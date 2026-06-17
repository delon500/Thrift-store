import pool from "../config/db.js";

export { pool };

// Minimal Express res double that captures the status code and JSON body.
export const mockRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  res.send = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

// Empties every table for per-test isolation. Guards hard against ever running
// outside a configured test database.
export const truncateAll = async () => {
  if (process.env.NODE_ENV !== "test" || !process.env.TEST_DATABASE_URL) {
    throw new Error("truncateAll refused: not a test database");
  }
  const { rows } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  if (rows.length === 0) return;
  const list = rows.map((row) => `public."${row.tablename}"`).join(", ");
  await pool.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
};

// Monotonic counter so emails are unique even when seedOrder is called several
// times within one test (institutions.contact_email and users.email are unique).
let seedSequence = 0;

// Seeds institution → buyer → product → order/item/payment and returns the rows.
// Defaults model a paid, ready-for-collection order holding a Reserved product.
export const seedOrder = async ({
  orderStatus = "ready_for_collection",
  paymentStatus = "paid",
  productStatus = "Reserved",
  itemStatus = "reserved",
} = {}) => {
  const seq = ++seedSequence;

  const institution = (
    await pool.query(
      `INSERT INTO institutions
        (institution_name, institution_type, contact_person_name, contact_email,
         contact_number, institution_phone, status)
       VALUES ('Test School', 'public', 'Contact', $1,
               '0000000000', '0000000000', 'approved')
       RETURNING id, institution_name`,
      [`school-${seq}@test.local`],
    )
  ).rows[0];

  const user = (
    await pool.query(
      `INSERT INTO users
        (role, full_name, email, contact_number, password_hash, institution_id, status)
       VALUES ('parent', 'Test Buyer', $1, '0000000000', 'x', $2, 'approved')
       RETURNING id`,
      [`buyer-${seq}@test.local`, institution.id],
    )
  ).rows[0];

  const product = (
    await pool.query(
      `INSERT INTO products
        (name, gender, price, status, category, institution_id, age, condition, listing_type)
       VALUES ('Test Blazer', 'Unisex', 100, $1, 'Uniform', $2, '10-11 years', 'Good', 'Thrift Store')
       RETURNING id, reference_number`,
      [productStatus, institution.id],
    )
  ).rows[0];

  const order = (
    await pool.query(
      `INSERT INTO collection_orders
        (user_id, institution_id, status, user_full_name, user_email,
         subtotal, service_fee, total)
       VALUES ($1, $2, $3, 'Test Buyer', 'buyer@test.local', 100, 1.5, 101.5)
       RETURNING id, order_reference`,
      [user.id, institution.id, orderStatus],
    )
  ).rows[0];

  await pool.query(
    `INSERT INTO collection_order_items
      (collection_order_id, product_id, product_reference_number, listing_type,
       product_name, institution_name, unit_price, quantity, item_status)
     VALUES ($1, $2, $3, 'Thrift Store', 'Test Blazer', $4, 100, 1, $5)`,
    [
      order.id,
      product.id,
      product.reference_number,
      institution.institution_name,
      itemStatus,
    ],
  );

  await pool.query(
    `INSERT INTO payments
      (collection_order_id, provider, payment_method, amount, currency, status)
     VALUES ($1, 'payfast', 'card', 101.5, 'ZAR', $2)`,
    [order.id, paymentStatus],
  );

  return { institution, user, product, order };
};

// Convenience lookups for assertions.
export const getOrderStatus = async (orderReference) =>
  (
    await pool.query(
      "SELECT status FROM collection_orders WHERE order_reference = $1",
      [orderReference],
    )
  ).rows[0]?.status;

export const getPaymentStatus = async (orderReference) =>
  (
    await pool.query(
      `SELECT p.status FROM payments p
       JOIN collection_orders co ON co.id = p.collection_order_id
       WHERE co.order_reference = $1`,
      [orderReference],
    )
  ).rows[0]?.status;

export const getProductStatus = async (productId) =>
  (await pool.query("SELECT status FROM products WHERE id = $1", [productId]))
    .rows[0]?.status;
