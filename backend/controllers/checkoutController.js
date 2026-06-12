import pool from "../config/db.js";
import { calculateCartSummary } from "./cartController.js";
import { createPayFastPayment } from "../services/payfastService.js";

const PAYMENT_METHODS = [
  { id: "card", label: "Card", provider: "payfast", type: "gateway" },
  {
    id: "instant_eft",
    label: "Instant EFT",
    provider: "payfast",
    type: "bank",
  },
  {
    id: "capitec_pay",
    label: "Capitec Pay",
    provider: "payfast",
    type: "bank",
  },
  { id: "absa_pay", label: "Absa Pay", provider: "payfast", type: "bank" },
  { id: "snapscan", label: "SnapScan", provider: "payfast", type: "qr" },
  { id: "zapper", label: "Zapper", provider: "payfast", type: "qr" },
  {
    id: "scan_to_pay",
    label: "Scan to Pay",
    provider: "payfast",
    type: "qr",
  },
  { id: "scode", label: "SCode", provider: "payfast", type: "retail" },
  { id: "mobicred", label: "Mobicred", provider: "payfast", type: "credit" },
];

const normalizePaymentMethod = (paymentMethod) =>
  PAYMENT_METHODS.find((method) => method.id === paymentMethod);

const getPaymentMethod = (paymentMethod) => {
  const method = normalizePaymentMethod(paymentMethod);

  if (!method) {
    throw new Error("Unsupported payment method");
  }

  return method;
};

const getPaymentMethods = async (_req, res) => {
  return res.json({ payment_methods: PAYMENT_METHODS });
};

const getActiveCartRows = async (client, userId) => {
  const result = await client.query(
    `SELECT
      c.id AS cart_id,
      ci.id AS cart_item_id,
      ci.product_id,
      ci.quantity,
      ci.unit_price::text AS price,
      p.name,
      p.reference_number,
      p.listing_type,
      p.status,
      p.institution_id,
      i.institution_name
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     JOIN institutions i ON i.id = p.institution_id
     WHERE c.user_id = $1
       AND c.status = 'active'
     ORDER BY ci.created_at ASC
     FOR UPDATE OF p`,
    [userId],
  );

  return result.rows;
};

const createCheckout = async (req, res) => {
  const client = await pool.connect();

  try {
    const method = getPaymentMethod(req.body.payment_method);

    await client.query("BEGIN");

    const rows = await getActiveCartRows(client, req.user.id);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const unavailable = rows.find((row) => row.status !== "Available");

    if (unavailable) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `${unavailable.name} is no longer available`,
      });
    }

    const institutionIds = new Set(rows.map((row) => row.institution_id));

    if (institutionIds.size !== 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Checkout can only contain items from one institution",
      });
    }

    const userResult = await client.query(
      "SELECT full_name, email FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];
    const summary = calculateCartSummary(rows);

    const orderResult = await client.query(
      `INSERT INTO collection_orders (
        user_id,
        institution_id,
        status,
        user_full_name,
        user_email,
        subtotal,
        service_fee,
        total,
        collection_note
      )
      VALUES ($1, $2, 'payment_pending', $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.id,
        rows[0].institution_id,
        user.full_name,
        user.email,
        summary.subtotal,
        summary.service_fee,
        summary.total,
        req.body.collection_note || null,
      ],
    );
    const order = orderResult.rows[0];

    for (const row of rows) {
      await client.query(
        `INSERT INTO collection_order_items (
          collection_order_id,
          product_id,
          product_reference_number,
          listing_type,
          product_name,
          institution_name,
          unit_price,
          quantity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
        [
          order.id,
          row.product_id,
          row.reference_number,
          row.listing_type,
          row.name,
          row.institution_name,
          row.price,
        ],
      );
    }

    const paymentGateway = createPayFastPayment({
      order,
      user,
      summary,
      method,
      req,
    });

    const paymentResult = await client.query(
      `INSERT INTO payments (
        collection_order_id,
        provider,
        provider_payment_id,
        payment_method,
        amount,
        currency
      )
      VALUES ($1, $2, $3, $4, $5, 'ZAR')
      RETURNING *`,
      [
        order.id,
        method.provider,
        null,
        method.id,
        summary.total,
      ],
    );

    await client.query(
      "UPDATE products SET status = 'Pending' WHERE id = ANY($1::uuid[])",
      [rows.map((row) => row.product_id)],
    );
    await client.query("UPDATE carts SET status = 'checked_out' WHERE id = $1", [
      rows[0].cart_id,
    ]);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Checkout created",
      checkout: {
        order_reference: order.order_reference,
        status: order.status,
        payment_method: method,
        payment: {
          id: paymentResult.rows[0].id,
          status: paymentResult.rows[0].status,
          amount: paymentResult.rows[0].amount,
          currency: paymentResult.rows[0].currency,
        },
        payment_gateway: paymentGateway,
        items: rows.map((row) => ({
          product_id: row.product_id,
          product_name: row.name,
          reference_number: row.reference_number,
          listing_type: row.listing_type,
          institution_name: row.institution_name,
          price: row.price,
        })),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.message === "Unsupported payment method") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Checkout failed", error: error.message });
  } finally {
    client.release();
  }
};

export {
  createCheckout,
  getPaymentMethod,
  getPaymentMethods,
  normalizePaymentMethod,
  PAYMENT_METHODS,
};
