import { v2 as cloudinary } from "cloudinary";
import pool from "../config/db.js";
import fs from "node:fs";
import OpenAI from "openai";
import { logActivity } from "../services/activityLog.js";
import { parsePagination } from "../lib/adminRules.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getImagesFromRequest = (req) => {
  const image1 = req.files?.image1?.[0];
  const image2 = req.files?.image2?.[0];
  const image3 = req.files?.image3?.[0];
  const image4 = req.files?.image4?.[0];
  const image5 = req.files?.image5?.[0];

  return [image1, image2, image3, image4, image5].filter(Boolean);
};

const analyseProduct = async (req, res) => {
  try {
    const images = getImagesFromRequest(req);

    if (images.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image",
      });
    }

    const imageInputs = images.map((file) => ({
      type: "input_image",
      image_url: `data:${file.mimetype};base64,${fs
        .readFileSync(file.path)
        .toString("base64")}`,
    }));
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Look at these product photos and extract product details as JSON.",
            },
            ...imageInputs,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "product_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              gender: { type: "string" },
              age: { type: "string" },
              condition: { type: "string" },
              listing_type: { type: "string" },
              price: { type: "string" },
            },
            required: [
              "name",
              "description",
              "category",
              "gender",
              "age",
              "condition",
              "listing_type",
              "price",
            ],
          },
        },
      },
    });

    const analysis = JSON.parse(response.output_text);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze product error:", error);
    return res.status(500).json({
      message: "AI analysis failed",
      error: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      description = "",
      gender,
      price,
      status = "Available",
      category,
      schoolId,
      age,
      condition,
      listing_type,
    } = req.body;

    // get product image
    // const image1 = req.files.image1 && req.files.image1[0];
    // const image2 = req.files.image2 && req.files.image2[0];
    // const image3 = req.files.image3 && req.files.image3[0];
    // const image4 = req.files.image4 && req.files.image4[0];
    // const image5 = req.files.image5 && req.files.image5[0];

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const image5 = req.files?.image5?.[0];

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const images = [image1, image2, image3, image4, image5].filter(Boolean);

    if (images.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image",
      });
    }

    if (
      !name ||
      !gender ||
      !price ||
      !category ||
      !age ||
      !condition ||
      !listing_type
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const finalInstitutionId =
      ["admin", "super_admin"].includes(req.user.role)
        ? schoolId
        : req.user.institution_id;

    if (!finalInstitutionId) {
      return res
        .status(400)
        .json({ message: "School / institution is required" });
    }

    const institutionCheck = await pool.query(
      "SELECT id, institution_name FROM institutions WHERE id = $1",
      [finalInstitutionId],
    );

    if (institutionCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "School / institution not found" });
    }

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    await client.query("BEGIN");

    const productResult = await client.query(
      `INSERT INTO products (name, description, gender, price, status, category, institution_id, age, "condition", listing_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        description,
        gender,
        price,
        status,
        category,
        finalInstitutionId,
        age,
        condition,
        listing_type,
      ],
    );

    const product = productResult.rows[0];

    for (let i = 0; i < imagesUrl.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, sort_order)
         VALUES ($1, $2, $3)`,
        [product.id, imagesUrl[i], i + 1],
      );
    }

    const finalProductResult = await client.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.gender,
        p.price::text AS price,
        p.status,
        p.reference_number,
        p.category,
        p.institution_id AS "schoolId",
        i.institution_name AS "schoolName",
        p.age,
        p."condition",
        p.listing_type
       FROM products p
       JOIN institutions i ON i.id = p.institution_id
       WHERE p.id = $1`,
      [product.id],
    );

    const imageResult = await client.query(
      `SELECT image_url
       FROM product_images
       WHERE product_id = $1
       ORDER BY sort_order ASC`,
      [product.id],
    );

    await client.query("COMMIT");

    const finalProduct = {
      ...finalProductResult.rows[0],
      image: imageResult.rows.map((row) => row.image_url),
    };

    logActivity({
      action: "product.created",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: finalProduct.schoolId,
      entityType: "product",
      entityId: finalProduct.id,
      entityRef: finalProduct.reference_number,
      description: `Added product ${finalProduct.name}`,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product: finalProduct,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create product error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const getProducts = async (req, res) => {
  try {
    const user = req.user;

    if (!user.institution_id) {
      return res.status(400).json({ message: "User has no institution" });
    }

    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.gender,
        p.price::text AS price,
        p.status,
        p.reference_number,
        p.category,
        p.institution_id AS "schoolId",
        i.institution_name AS "schoolName",
        p.age,
        p."condition",
        p.listing_type
       FROM products p
       JOIN institutions i ON i.id = p.institution_id
       WHERE p.institution_id = $1 AND p.status = 'Available'`,
      [user.institution_id],
    );

    const imagesResult = await pool.query(
      `SELECT product_id, image_url FROM product_images`,
    );

    const grouped = imagesResult.rows.reduce((acc, img) => {
      if (!acc[img.product_id]) acc[img.product_id] = [];
      acc[img.product_id].push(img.image_url);
      return acc;
    }, {});

    const products = result.rows.map((p) => ({
      ...p,
      image: grouped[p.id] || [],
    }));

    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};
const PRODUCT_STATUSES = [
  "Available",
  "Sold",
  "Pending",
  "Reserved",
  "Claimed",
  "Cancelled",
];
const LISTING_TYPES = ["Thrift Store", "Lost and Found"];
// A product tied to a live order/reservation must not be hard-deleted.
const DELETE_BLOCKED_STATUSES = ["Pending", "Reserved", "Claimed"];
const EDITABLE_FIELDS = [
  "name",
  "description",
  "gender",
  "age",
  "category",
  "condition",
  "listing_type",
  "price",
  "status",
];

const ADMIN_PRODUCT_SELECT = `
  SELECT
    p.id,
    p.name,
    p.description,
    p.gender,
    p.price::text AS price,
    p.status,
    p.reference_number,
    p.category,
    p.institution_id AS "schoolId",
    i.institution_name AS "schoolName",
    p.age,
    p."condition",
    p.listing_type,
    p.created_at
  FROM products p
  JOIN institutions i ON i.id = p.institution_id`;

const attachImages = async (rows) => {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const images = await pool.query(
    `SELECT product_id, image_url
     FROM product_images
     WHERE product_id = ANY($1::uuid[])
     ORDER BY sort_order ASC`,
    [ids],
  );

  const grouped = images.rows.reduce((acc, img) => {
    (acc[img.product_id] ||= []).push(img.image_url);
    return acc;
  }, {});

  return rows.map((row) => ({ ...row, image: grouped[row.id] || [] }));
};

const fetchAdminProduct = async (id) => {
  const result = await pool.query(`${ADMIN_PRODUCT_SELECT} WHERE p.id = $1`, [id]);

  if (result.rows.length === 0) return null;

  const [product] = await attachImages(result.rows);
  return product;
};

// GET /api/products/admin — full catalogue for admins, with optional filters
// (institution_id, status, listing_type, q). Not scoped to one institution.
const listAdminProducts = async (req, res) => {
  try {
    const { institution_id, status, listing_type, q } = req.query;
    const conditions = [];
    const values = [];

    if (institution_id) {
      values.push(institution_id);
      conditions.push(`p.institution_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }
    if (listing_type) {
      values.push(listing_type);
      conditions.push(`p.listing_type = $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      conditions.push(
        `(p.name ILIKE $${values.length} OR p.reference_number ILIKE $${values.length})`,
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM products p ${where}`,
      values,
    );

    const listValues = [...values];
    let listQuery = `${ADMIN_PRODUCT_SELECT} ${where} ORDER BY p.created_at DESC NULLS LAST`;
    const { limit, offset } = parsePagination(req.query);
    if (limit) {
      listValues.push(limit);
      listQuery += ` LIMIT $${listValues.length}`;
      listValues.push(offset);
      listQuery += ` OFFSET $${listValues.length}`;
    }

    const result = await pool.query(listQuery, listValues);
    const products = await attachImages(result.rows);
    return res.json({ products, total: totalResult.rows[0].total });
  } catch (error) {
    console.error("List admin products error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

// PATCH /api/products/:id — update editable product fields (admin only).
const updateProduct = async (req, res) => {
  try {
    if (req.body.status && !PRODUCT_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid product status" });
    }
    if (req.body.listing_type && !LISTING_TYPES.includes(req.body.listing_type)) {
      return res.status(400).json({ message: "Invalid listing type" });
    }
    if (
      req.body.price !== undefined &&
      (Number.isNaN(Number(req.body.price)) || Number(req.body.price) < 0)
    ) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const updates = [];
    const values = [];

    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue;
      values.push(req.body[field]);
      // "condition" is a reserved word and must stay quoted.
      const column = field === "condition" ? '"condition"' : field;
      updates.push(`${column} = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE products SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await fetchAdminProduct(req.params.id);

    logActivity({
      action: "product.updated",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: product?.schoolId,
      entityType: "product",
      entityId: product?.id,
      entityRef: product?.reference_number,
      description: `Updated product ${product?.name}`,
    });

    return res.json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update product error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
};

// DELETE /api/products/:id — remove a product (admin only). Blocked while the
// product is reserved/pending/claimed so live orders are never orphaned.
// product_images rows cascade; collection_order_items keep history (FK SET NULL).
const deleteProduct = async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT id, name, status FROM products WHERE id = $1",
      [req.params.id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (DELETE_BLOCKED_STATUSES.includes(existing.rows[0].status)) {
      return res.status(409).json({
        message: `Cannot delete "${existing.rows[0].name}" while it is ${existing.rows[0].status.toLowerCase()} in an order.`,
      });
    }

    await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);

    logActivity({
      action: "product.deleted",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "product",
      entityId: req.params.id,
      entityRef: existing.rows[0].name,
      description: `Deleted product ${existing.rows[0].name}`,
    });

    return res.json({ message: "Product deleted", id: req.params.id });
  } catch (error) {
    console.error("Delete product error:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
};

export {
  createProduct,
  analyseProduct,
  getProducts,
  listAdminProducts,
  updateProduct,
  deleteProduct,
};
