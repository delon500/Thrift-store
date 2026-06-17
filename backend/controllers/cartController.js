import pool from "../config/db.js";
import { getServiceFee } from "../services/settingsService.js";

// Fallback fee — kept in sync with SETTINGS_DEFAULTS.service_fee. Used when no
// configured fee is passed in (e.g. pure unit tests), so the function stays
// pure and synchronous; controllers pass the live fee from settings.
const DEFAULT_SERVICE_FEE = 1.5;

const calculateCartSummary = (items, serviceFee = DEFAULT_SERVICE_FEE) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const total_items = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );
  const service_fee = total_items > 0 ? Number(serviceFee) : 0;

  return {
    subtotal,
    service_fee,
    total: subtotal + service_fee,
    total_items,
  };
};

const serializeCart = ({
  cartId,
  status = "active",
  rows = [],
  serviceFee = DEFAULT_SERVICE_FEE,
}) => {
  const items = rows.map((row) => ({
    id: row.cart_item_id,
    product_id: row.product_id,
    name: row.name,
    schoolName: row.schoolName,
    image: row.image || [],
    price: row.price,
    quantity: Number(row.quantity),
    reference_number: row.reference_number,
    listing_type: row.listing_type,
    condition: row.condition,
    status: row.status,
  }));

  return {
    id: cartId,
    status,
    items,
    summary: calculateCartSummary(items, serviceFee),
  };
};

const getOrCreateActiveCart = async (client, userId) => {
  const existing = await client.query(
    "SELECT id, status FROM carts WHERE user_id = $1 AND status = 'active'",
    [userId],
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const created = await client.query(
    "INSERT INTO carts (user_id) VALUES ($1) RETURNING id, status",
    [userId],
  );

  return created.rows[0];
};

const getCartRows = async (client, cartId) => {
  const result = await client.query(
    `SELECT
      ci.id AS cart_item_id,
      ci.product_id,
      ci.quantity,
      ci.unit_price::text AS price,
      p.name,
      p.reference_number,
      p.listing_type,
      p."condition",
      p.status,
      i.institution_name AS "schoolName",
      COALESCE(
        array_agg(pi.image_url ORDER BY pi.sort_order)
          FILTER (WHERE pi.image_url IS NOT NULL),
        '{}'
      ) AS image
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN institutions i ON i.id = p.institution_id
     LEFT JOIN product_images pi ON pi.product_id = p.id
     WHERE ci.cart_id = $1
     GROUP BY
      ci.id,
      ci.product_id,
      ci.quantity,
      ci.unit_price,
      p.name,
      p.reference_number,
      p.listing_type,
      p."condition",
      p.status,
      i.institution_name
     ORDER BY ci.created_at ASC`,
    [cartId],
  );

  return result.rows;
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateActiveCart(pool, req.user.id);
    const rows = await getCartRows(pool, cart.id);
    const serviceFee = await getServiceFee();

    return res.json(
      serializeCart({ cartId: cart.id, status: cart.status, rows, serviceFee }),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch cart", error: error.message });
  }
};

const addCartItem = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Product is required" });
    }

    const productResult = await pool.query(
      `SELECT id, price, status, institution_id
       FROM products
       WHERE id = $1`,
      [product_id],
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productResult.rows[0];

    if (product.status !== "Available") {
      return res.status(400).json({ message: "Product is not available" });
    }

    const cart = await getOrCreateActiveCart(pool, req.user.id);

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET updated_at = now()
       RETURNING id`,
      [cart.id, product.id, product.price],
    );

    const rows = await getCartRows(pool, cart.id);
    const serviceFee = await getServiceFee();

    return res
      .status(201)
      .json(
        serializeCart({ cartId: cart.id, status: cart.status, rows, serviceFee }),
      );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add item to cart", error: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateActiveCart(pool, req.user.id);

    await pool.query(
      `DELETE FROM cart_items
       WHERE id = $1 AND cart_id = $2`,
      [req.params.cartItemId, cart.id],
    );

    const rows = await getCartRows(pool, cart.id);
    const serviceFee = await getServiceFee();

    return res.json(
      serializeCart({ cartId: cart.id, status: cart.status, rows, serviceFee }),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to remove cart item", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateActiveCart(pool, req.user.id);

    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);

    return res.json(serializeCart({ cartId: cart.id, status: cart.status, rows: [] }));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to clear cart", error: error.message });
  }
};

const checkoutCart = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cart = await getOrCreateActiveCart(client, req.user.id);
    const rows = await getCartRows(client, cart.id);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const productIds = rows.map((row) => row.product_id);
    const productsResult = await client.query(
      `SELECT
        p.id,
        p.name,
        p.reference_number,
        p.listing_type,
        p.price,
        p.status,
        p.institution_id,
        i.institution_name
       FROM products p
       JOIN institutions i ON i.id = p.institution_id
       WHERE p.id = ANY($1::uuid[])
       FOR UPDATE OF p`,
      [productIds],
    );

    const products = productsResult.rows;
    const unavailable = products.find((product) => product.status !== "Available");

    if (unavailable) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `${unavailable.name} is no longer available`,
      });
    }

    const institutionIds = new Set(
      products.map((product) => product.institution_id),
    );

    if (institutionIds.size !== 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Collection orders can only contain items from one institution",
      });
    }

    const userResult = await client.query(
      "SELECT full_name, email FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];
    const summary = calculateCartSummary(rows, await getServiceFee());
    const institutionId = products[0].institution_id;

    const orderResult = await client.query(
      `INSERT INTO collection_orders (
        user_id,
        institution_id,
        user_full_name,
        user_email,
        subtotal,
        service_fee,
        total,
        collection_note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.id,
        institutionId,
        user.full_name,
        user.email,
        summary.subtotal,
        summary.service_fee,
        summary.total,
        req.body.collection_note || null,
      ],
    );
    const order = orderResult.rows[0];

    for (const product of products) {
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
          product.id,
          product.reference_number,
          product.listing_type,
          product.name,
          product.institution_name,
          product.price,
        ],
      );
    }

    await client.query(
      "UPDATE products SET status = 'Reserved' WHERE id = ANY($1::uuid[])",
      [productIds],
    );
    await client.query("UPDATE carts SET status = 'checked_out' WHERE id = $1", [
      cart.id,
    ]);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Collection confirmed",
      order: {
        id: order.id,
        order_reference: order.order_reference,
        status: order.status,
        subtotal: order.subtotal,
        service_fee: order.service_fee,
        total: order.total,
        items: products.map((product) => ({
          product_id: product.id,
          product_name: product.name,
          reference_number: product.reference_number,
          listing_type: product.listing_type,
          institution_name: product.institution_name,
          price: product.price,
        })),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res
      .status(500)
      .json({ message: "Checkout failed", error: error.message });
  } finally {
    client.release();
  }
};

export {
  addCartItem,
  calculateCartSummary,
  checkoutCart,
  clearCart,
  getCart,
  removeCartItem,
  serializeCart,
};
