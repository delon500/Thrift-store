import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";
import {
  parsePagination,
  userDeleteError,
  userUpdateError,
} from "../lib/adminRules.js";

const toCountMap = (rows, keyField, valueField = "count") =>
  rows.reduce((acc, row) => {
    acc[row[keyField]] = Number(row[valueField]);
    return acc;
  }, {});

// GET /api/admin/stats — headline counts + a 14-day time series for the charts.
const getDashboardStats = async (_req, res) => {
  try {
    const [usersByRole, activity, ordersByStatus, revenue, inventory, series] =
      await Promise.all([
        pool.query("SELECT role, count(*)::int AS count FROM users GROUP BY role"),
        pool.query(
          `SELECT
            count(*) FILTER (WHERE action = 'user.login')::int AS logins,
            count(*) FILTER (WHERE action = 'user.register')::int AS registrations
           FROM activity_logs`,
        ),
        pool.query(
          "SELECT status, count(*)::int AS count FROM collection_orders GROUP BY status",
        ),
        pool.query(
          `SELECT COALESCE(SUM(co.total), 0)::numeric(12,2)::text AS revenue
           FROM collection_orders co
           JOIN payments p ON p.collection_order_id = co.id
           WHERE p.status = 'paid'`,
        ),
        pool.query(
          "SELECT status, count(*)::int AS count FROM products GROUP BY status",
        ),
        pool.query(
          `SELECT
            to_char(d, 'YYYY-MM-DD') AS day,
            COALESCE(reg.cnt, 0)::int AS registrations,
            COALESCE(lg.cnt, 0)::int AS logins,
            COALESCE(ord.cnt, 0)::int AS orders,
            COALESCE(rev.amount, 0)::numeric(12,2)::text AS revenue
           FROM generate_series(
             current_date - interval '13 days', current_date, interval '1 day'
           ) d
           LEFT JOIN (
             SELECT created_at::date AS day, count(*) AS cnt
             FROM activity_logs WHERE action = 'user.register' GROUP BY 1
           ) reg ON reg.day = d::date
           LEFT JOIN (
             SELECT created_at::date AS day, count(*) AS cnt
             FROM activity_logs WHERE action = 'user.login' GROUP BY 1
           ) lg ON lg.day = d::date
           LEFT JOIN (
             SELECT created_at::date AS day, count(*) AS cnt
             FROM collection_orders GROUP BY 1
           ) ord ON ord.day = d::date
           LEFT JOIN (
             SELECT co.created_at::date AS day, SUM(co.total) AS amount
             FROM collection_orders co
             JOIN payments p ON p.collection_order_id = co.id
             WHERE p.status = 'paid' GROUP BY 1
           ) rev ON rev.day = d::date
           ORDER BY day`,
        ),
      ]);

    const roleMap = toCountMap(usersByRole.rows, "role");

    return res.json({
      users: {
        by_role: roleMap,
        total: Object.values(roleMap).reduce((sum, n) => sum + n, 0),
        schools: roleMap.school || 0,
        universities: roleMap.university || 0,
        parents: roleMap.parent || 0,
        students: roleMap.student || 0,
        staff: roleMap.admin || 0,
      },
      activity: {
        logins: activity.rows[0].logins,
        registrations: activity.rows[0].registrations,
      },
      orders: {
        by_status: toCountMap(ordersByStatus.rows, "status"),
        revenue: revenue.rows[0].revenue,
      },
      inventory: { by_status: toCountMap(inventory.rows, "status") },
      timeseries: series.rows,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load stats", error: error.message });
  }
};

// GET /api/admin/logs?limit=&offset=&action= — paginated activity feed.
const listActivityLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const values = [];
    let where = "";

    if (req.query.action) {
      values.push(req.query.action);
      where = `WHERE action = $${values.length}`;
    }

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM activity_logs ${where}`,
      values,
    );

    const logsResult = await pool.query(
      `SELECT id, action, actor_name, actor_role, entity_type, entity_ref,
              description, created_at
       FROM activity_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );

    return res.json({ logs: logsResult.rows, total: totalResult.rows[0].total });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load logs", error: error.message });
  }
};

// GET /api/admin/users?role=&status=&q= — registered users, filterable.
const listUsersByRole = async (req, res) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.role) {
      values.push(req.query.role);
      conditions.push(`u.role = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`u.status = $${values.length}`);
    }
    if (req.query.q) {
      values.push(`%${req.query.q}%`);
      conditions.push(
        `(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`,
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM users u ${where}`,
      values,
    );

    const listValues = [...values];
    let listQuery = `SELECT
        u.id, u.full_name, u.email, u.contact_number, u.role, u.status,
        u.created_at, i.institution_name
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       ${where}
       ORDER BY u.created_at DESC`;
    const { limit, offset } = parsePagination(req.query);
    if (limit) {
      listValues.push(limit);
      listQuery += ` LIMIT $${listValues.length}`;
      listValues.push(offset);
      listQuery += ` OFFSET $${listValues.length}`;
    }

    const result = await pool.query(listQuery, listValues);
    return res.json({ users: result.rows, total: totalResult.rows[0].total });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load users", error: error.message });
  }
};

// PATCH /api/admin/users/:id — edit a user and/or change their status
// (approved <-> suspended, etc.).
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, contact_number, status } = req.body;

    const ruleError = userUpdateError({ status, isSelf: id === req.user.id });
    if (ruleError) {
      return res.status(ruleError.status).json({ message: ruleError.message });
    }

    const updates = [];
    const values = [];

    if (typeof full_name === "string" && full_name.trim()) {
      values.push(full_name.trim());
      updates.push(`full_name = $${values.length}`);
    }
    if (typeof contact_number === "string") {
      values.push(contact_number.trim());
      updates.push(`contact_number = $${values.length}`);
    }
    if (status) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")}, updated_at = now()
       WHERE id = $${values.length}
       RETURNING id, full_name, email, contact_number, role, status`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    logActivity({
      action: status === "suspended" ? "user.suspended" : "user.updated",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "user",
      entityId: user.id,
      entityRef: user.email,
      description: `Updated ${user.full_name}${status ? ` → ${status}` : ""}`,
    });

    return res.json({ message: "User updated", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

// POST /api/admin/users/:id/reset-password — set a new password for a user.
const resetUserPassword = async (req, res) => {
  try {
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = now()
       WHERE id = $2 RETURNING id, full_name, email`,
      [passwordHash, req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    logActivity({
      action: "user.password_reset",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "user",
      entityId: result.rows[0].id,
      entityRef: result.rows[0].email,
      description: `Reset password for ${result.rows[0].full_name}`,
    });

    return res.json({ message: "Password reset" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to reset password", error: error.message });
  }
};

// DELETE /api/admin/users/:id — hard-delete a user (blocked if they have orders;
// suspend those instead so order history is preserved).
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      "SELECT id, full_name, email FROM users WHERE id = $1",
      [id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await pool.query(
      "SELECT 1 FROM collection_orders WHERE user_id = $1 LIMIT 1",
      [id],
    );

    const ruleError = userDeleteError({
      isSelf: id === req.user.id,
      hasOrders: orders.rows.length > 0,
    });
    if (ruleError) {
      return res.status(ruleError.status).json({ message: ruleError.message });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    logActivity({
      action: "user.deleted",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "user",
      entityId: id,
      entityRef: userResult.rows[0].email,
      description: `Deleted ${userResult.rows[0].full_name}`,
    });

    return res.json({ message: "User deleted", id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

export {
  deleteUser,
  getDashboardStats,
  listActivityLogs,
  listUsersByRole,
  resetUserPassword,
  updateUser,
};
