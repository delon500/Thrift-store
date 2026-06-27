import crypto from "crypto";
import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";

// ~11-char URL-safe random string. The unique index on item_tags.token is the
// real guarantee; a collision (1 in 2^64) just rolls the batch back to retry.
const randomToken = () => crypto.randomBytes(8).toString("base64url");

// POST /api/admin/tags/batches — generate a run of unactivated stickers for one
// institution. Each tag gets a sequential `code` (DB default) + a random token.
const createBatch = async (req, res) => {
  const { institution_id, quantity, note } = req.body;
  const qty = Number(quantity);

  if (!institution_id || !Number.isInteger(qty) || qty < 1 || qty > 1000) {
    return res.status(400).json({
      message: "institution_id and a quantity between 1 and 1000 are required",
    });
  }

  const client = await pool.connect();
  try {
    const inst = await client.query(
      "SELECT id, institution_name FROM institutions WHERE id = $1",
      [institution_id],
    );
    if (inst.rows.length === 0) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const tokens = Array.from({ length: qty }, randomToken);

    await client.query("BEGIN");
    const batch = await client.query(
      `INSERT INTO tag_batches (institution_id, quantity, note, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, institution_id, quantity, note, created_at`,
      [institution_id, qty, note || null, req.user.id],
    );
    const tags = await client.query(
      `INSERT INTO item_tags (token, batch_id, institution_id)
       SELECT t, $1, $2 FROM unnest($3::text[]) AS t
       RETURNING code, token, status`,
      [batch.rows[0].id, institution_id, tokens],
    );
    await client.query("COMMIT");

    logActivity({
      action: "tag.batch.created",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: institution_id,
      entityType: "tag_batch",
      entityRef: batch.rows[0].id,
      description: `Generated ${qty} QR tags for ${inst.rows[0].institution_name}`,
    });

    return res.status(201).json({ batch: batch.rows[0], tags: tags.rows });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failure
    }
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Code collision — please try generating again" });
    }
    return res
      .status(500)
      .json({ message: "Failed to generate tags", error: error.message });
  } finally {
    client.release();
  }
};

// GET /api/admin/tags/batches — every batch with its institution + activated count.
const listBatches = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.institution_id, i.institution_name, b.quantity, b.note,
              b.created_at,
              COUNT(t.id) FILTER (WHERE t.status <> 'unactivated')::int AS activated_count
       FROM tag_batches b
       JOIN institutions i ON i.id = b.institution_id
       LEFT JOIN item_tags t ON t.batch_id = b.id
       GROUP BY b.id, i.institution_name
       ORDER BY b.created_at DESC`,
    );
    return res.json({ batches: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to list batches", error: error.message });
  }
};

// GET /api/admin/tags/batches/:id — one batch + its tags (for the printable sheet).
const getBatch = async (req, res) => {
  try {
    const batch = await pool.query(
      `SELECT b.id, b.institution_id, i.institution_name, b.quantity, b.note,
              b.created_at
       FROM tag_batches b
       JOIN institutions i ON i.id = b.institution_id
       WHERE b.id = $1`,
      [req.params.id],
    );
    if (batch.rows.length === 0) {
      return res.status(404).json({ message: "Batch not found" });
    }
    const tags = await pool.query(
      `SELECT code, token, status, label, activated_at
       FROM item_tags WHERE batch_id = $1 ORDER BY code`,
      [req.params.id],
    );
    return res.json({ batch: batch.rows[0], tags: tags.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load batch", error: error.message });
  }
};

export { createBatch, listBatches, getBatch };
