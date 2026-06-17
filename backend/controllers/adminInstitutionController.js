import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";
import {
  institutionDeleteError,
  parsePagination,
  USER_STATUSES,
} from "../lib/adminRules.js";

const INSTITUTION_TYPES = ["public", "private", "independent"];
const INSTITUTION_CATEGORIES = ["school", "university"];
const EDITABLE_FIELDS = [
  "institution_name",
  "registration_number",
  "contact_person_name",
  "contact_email",
  "contact_number",
  "institution_phone",
  "institution_type",
  "institution_category",
  "status",
];

const INSTITUTION_SELECT = `
  SELECT
    i.id, i.institution_name, i.institution_category, i.institution_type,
    i.registration_number, i.contact_person_name, i.contact_email,
    i.contact_number, i.institution_phone, i.status, i.created_at,
    (SELECT count(*)::int FROM users u WHERE u.institution_id = i.id) AS user_count,
    (SELECT count(*)::int FROM products p WHERE p.institution_id = i.id) AS product_count
  FROM institutions i
`;

// GET /api/admin/institutions?q=&status=&limit=&offset=
const listInstitutions = async (req, res) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.q) {
      values.push(`%${req.query.q}%`);
      conditions.push(
        `(i.institution_name ILIKE $${values.length} OR i.contact_email ILIKE $${values.length})`,
      );
    }
    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`i.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM institutions i ${where}`,
      values,
    );

    const listValues = [...values];
    let listQuery = `${INSTITUTION_SELECT} ${where} ORDER BY i.created_at DESC`;
    const { limit, offset } = parsePagination(req.query);
    if (limit) {
      listValues.push(limit);
      listQuery += ` LIMIT $${listValues.length}`;
      listValues.push(offset);
      listQuery += ` OFFSET $${listValues.length}`;
    }

    const result = await pool.query(listQuery, listValues);
    return res.json({
      institutions: result.rows,
      total: totalResult.rows[0].total,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load institutions", error: error.message });
  }
};

// PATCH /api/admin/institutions/:id — edit details and/or status.
const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (body.status && !USER_STATUSES.includes(body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (body.institution_type && !INSTITUTION_TYPES.includes(body.institution_type)) {
      return res.status(400).json({ message: "Invalid institution type" });
    }
    if (
      body.institution_category &&
      !INSTITUTION_CATEGORIES.includes(body.institution_category)
    ) {
      return res.status(400).json({ message: "Invalid institution category" });
    }

    const updates = [];
    const values = [];
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        values.push(
          typeof body[field] === "string" ? body[field].trim() : body[field],
        );
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE institutions SET ${updates.join(", ")}, updated_at = now()
       WHERE id = $${values.length}
       RETURNING id, institution_name, status`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const institution = result.rows[0];
    logActivity({
      action:
        body.status === "suspended"
          ? "institution.suspended"
          : "institution.updated",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: institution.id,
      entityType: "institution",
      entityId: institution.id,
      entityRef: institution.institution_name,
      description: `Updated ${institution.institution_name}${body.status ? ` → ${body.status}` : ""}`,
    });

    return res.json({ message: "Institution updated", institution });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update institution", error: error.message });
  }
};

// DELETE /api/admin/institutions/:id — blocked if it still has users or products.
const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await pool.query(
      "SELECT id, institution_name FROM institutions WHERE id = $1",
      [id],
    );
    if (institution.rows.length === 0) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const users = await pool.query(
      "SELECT 1 FROM users WHERE institution_id = $1 LIMIT 1",
      [id],
    );
    const products = await pool.query(
      "SELECT 1 FROM products WHERE institution_id = $1 LIMIT 1",
      [id],
    );

    const ruleError = institutionDeleteError({
      hasUsers: users.rows.length > 0,
      hasProducts: products.rows.length > 0,
    });
    if (ruleError) {
      return res.status(ruleError.status).json({ message: ruleError.message });
    }

    await pool.query("DELETE FROM institutions WHERE id = $1", [id]);

    logActivity({
      action: "institution.deleted",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "institution",
      entityId: id,
      entityRef: institution.rows[0].institution_name,
      description: `Deleted ${institution.rows[0].institution_name}`,
    });

    return res.json({ message: "Institution deleted", id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete institution", error: error.message });
  }
};

export { deleteInstitution, listInstitutions, updateInstitution };
