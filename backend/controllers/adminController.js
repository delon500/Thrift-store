import pool from "../config/db.js";

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
    const result = await pool.query(
      `SELECT
        u.id, u.full_name, u.email, u.contact_number, u.role, u.status,
        u.created_at, i.institution_name
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       ${where}
       ORDER BY u.created_at DESC`,
      values,
    );

    return res.json({ users: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load users", error: error.message });
  }
};

export { getDashboardStats, listActivityLogs, listUsersByRole };
