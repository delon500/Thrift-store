import { v2 as cloudinary } from "cloudinary";
import pool from "../config/db.js";
import fs from "node:fs";
import OpenAI from "openai";

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
      slug,
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
      !slug ||
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

    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1",
      [slug],
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const finalInstitutionId =
      req.user.role === "admin" ? schoolId : req.user.institution_id;

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
      `INSERT INTO products (slug, name, description, gender, price, status, category, institution_id, age, "condition", listing_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        slug,
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
        p.slug,
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
       WHERE p.institution_id = $1`,
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
export { createProduct, analyseProduct, getProducts };
