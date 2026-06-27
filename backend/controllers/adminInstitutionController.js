import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { logActivity } from "../services/activityLog.js";
import {
  institutionDeleteError,
  parsePagination,
  USER_STATUSES,
} from "../lib/adminRules.js";
import {
  getSettings,
  getInstitutionOverrides,
  invalidateSettingsCache,
  PAYMENT_METHOD_CATALOG,
  SETTING_KEYS,
} from "../services/settingsService.js";
import { validateSettingsPatch } from "../lib/settingsRules.js";

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

const findInstitution = async (id) => {
  const result = await pool.query(
    "SELECT id, institution_name, institution_category FROM institutions WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

// GET /api/admin/institutions/:id/staff — the institution's staff accounts
// (its school/university-role logins), not its buyers.
const listInstitutionUsers = async (req, res) => {
  try {
    const institution = await findInstitution(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, contact_number, role, status, created_at
       FROM users
       WHERE institution_id = $1 AND role IN ('school', 'university')
       ORDER BY created_at DESC`,
      [institution.id],
    );

    return res.json({ institution, users: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load accounts", error: error.message });
  }
};

// POST /api/admin/institutions/:id/staff — create a login for the institution.
// The role is the institution's category (school|university); the account is
// approved immediately. Super-admin only.
const createInstitutionUser = async (req, res) => {
  try {
    const institution = await findInstitution(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    if (!["school", "university"].includes(institution.institution_category)) {
      return res
        .status(400)
        .json({ message: "Institution has no valid category for an account" });
    }

    const { full_name, email, contact_number, password, confirm_password } =
      req.body;

    if (!full_name || !email || !contact_number || !password) {
      return res.status(400).json({
        message: "Full name, email, contact number and password are required",
      });
    }
    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const role = institution.institution_category; // school | university

    const result = await pool.query(
      `INSERT INTO users (
        role, full_name, email, contact_number, password_hash, institution_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'approved')
      RETURNING id, role, full_name, email, contact_number, status, created_at`,
      [role, full_name, email, contact_number, password_hash, institution.id],
    );

    logActivity({
      action: "institution.user.created",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: institution.id,
      entityType: "user",
      entityRef: email,
      description: `Created ${role} account ${email} for ${institution.institution_name}`,
    });

    return res
      .status(201)
      .json({ message: "Account created", user: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create account", error: error.message });
  }
};

// GET /api/admin/institutions/:id/settings — this institution's effective
// settings, which keys it overrides, the global values to compare against, and
// the payment-method catalog for the toggles.
const getInstitutionSettings = async (req, res) => {
  try {
    const institution = await findInstitution(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const [settings, overrides, global] = await Promise.all([
      getSettings(institution.id),
      getInstitutionOverrides(institution.id),
      getSettings(null),
    ]);

    return res.json({
      institution,
      settings, // effective (override -> global -> default)
      overrides, // only the keys this institution sets
      global, // platform defaults to show alongside
      payment_method_catalog: PAYMENT_METHOD_CATALOG,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load institution settings", error: error.message });
  }
};

// PUT /api/admin/institutions/:id/settings — set overrides (any of service_fee,
// checkout_expiry_minutes, enabled_payment_methods) and/or clear them back to the
// global default via `clear: ["key", ...]`. Super-admin only.
const updateInstitutionSettings = async (req, res) => {
  try {
    const institution = await findInstitution(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const { clear, ...patch } = req.body || {};
    const clearKeys = Array.isArray(clear)
      ? clear.filter((key) => SETTING_KEYS.includes(key))
      : [];

    let value = {};
    if (Object.keys(patch).length > 0) {
      const result = validateSettingsPatch(
        patch,
        PAYMENT_METHOD_CATALOG.map((method) => method.id),
      );
      if (result.error) return res.status(400).json({ message: result.error });
      value = result.value;
    }

    if (clearKeys.length === 0 && Object.keys(value).length === 0) {
      return res
        .status(400)
        .json({ message: "Provide settings to override or keys to clear" });
    }

    // A key can't be both set and cleared in one request.
    const conflict = clearKeys.find((key) => key in value);
    if (conflict) {
      return res
        .status(400)
        .json({ message: `Cannot set and clear "${conflict}" at once` });
    }

    if (clearKeys.length > 0) {
      await pool.query(
        "DELETE FROM institution_settings WHERE institution_id = $1 AND key = ANY($2)",
        [institution.id, clearKeys],
      );
    }

    for (const [key, val] of Object.entries(value)) {
      await pool.query(
        `INSERT INTO institution_settings (institution_id, key, value, updated_at, updated_by)
         VALUES ($1, $2, $3::jsonb, now(), $4)
         ON CONFLICT (institution_id, key)
         DO UPDATE SET value = EXCLUDED.value,
                       updated_at = now(),
                       updated_by = EXCLUDED.updated_by`,
        [institution.id, key, JSON.stringify(val), req.user.id],
      );
    }

    invalidateSettingsCache(institution.id);

    logActivity({
      action: "institution.settings.updated",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: institution.id,
      entityType: "institution",
      entityRef: institution.id,
      description: `Updated settings for ${institution.institution_name}`,
      metadata: { set: Object.keys(value), cleared: clearKeys },
    });

    const [settings, overrides, global] = await Promise.all([
      getSettings(institution.id),
      getInstitutionOverrides(institution.id),
      getSettings(null),
    ]);

    return res.json({
      message: "Institution settings updated",
      institution,
      settings,
      overrides,
      global,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update institution settings", error: error.message });
  }
};

export {
  deleteInstitution,
  listInstitutions,
  updateInstitution,
  getInstitutionSettings,
  updateInstitutionSettings,
  listInstitutionUsers,
  createInstitutionUser,
};
