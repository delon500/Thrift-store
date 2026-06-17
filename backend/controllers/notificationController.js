import pool from "../config/db.js";
import { parsePagination } from "../lib/adminRules.js";

const NOTIFICATION_SELECT = `
  SELECT id, type, title, body, entity_type, entity_ref, link, read_at, created_at
  FROM notifications
  WHERE user_id = $1
`;

// GET /api/notifications?unread=&limit=&offset= — the signed-in user's own
// notifications, newest first. Returns the list, the total, and the unread
// count (so the bell badge stays correct regardless of the current page).
const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unread === "true";
    const { limit, offset } = parsePagination(req.query);

    const where = unreadOnly
      ? `${NOTIFICATION_SELECT} AND read_at IS NULL`
      : NOTIFICATION_SELECT;

    const params = [userId];
    let sql = `${where} ORDER BY created_at DESC`;
    if (limit !== null) {
      params.push(limit, offset);
      sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const [list, totals] = await Promise.all([
      pool.query(sql, params),
      pool.query(
        `SELECT
           count(*)::int AS total,
           count(*) FILTER (WHERE read_at IS NULL)::int AS unread
         FROM notifications WHERE user_id = $1`,
        [userId],
      ),
    ]);

    return res.json({
      notifications: list.rows,
      total: totals.rows[0].total,
      unread: totals.rows[0].unread,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load notifications", error: error.message });
  }
};

// GET /api/notifications/unread-count — lightweight count for the bell badge.
const unreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT count(*)::int AS unread
       FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id],
    );
    return res.json({ unread: result.rows[0].unread });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load unread count", error: error.message });
  }
};

// PATCH /api/notifications/:id/read — mark one of the user's notifications read.
const markRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read_at = now()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING id`,
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      // Either it doesn't exist, isn't theirs, or was already read — all benign.
      return res.json({ message: "No change" });
    }

    return res.json({ message: "Marked read" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark notification read", error: error.message });
  }
};

// PATCH /api/notifications/read-all — mark all the user's notifications read.
const markAllRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read_at = now()
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id],
    );
    return res.json({ message: "All marked read", updated: result.rowCount });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark all read", error: error.message });
  }
};

export { listNotifications, markAllRead, markRead, unreadCount };
