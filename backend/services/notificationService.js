import pool from "../config/db.js";

// Creates one in-app notification for a user. Fire-and-forget and fully guarded:
// creating a notification must never break or slow down the action that
// triggered it (the order paid, the registration approved, etc.).
const createNotification = async ({
  userId,
  type,
  title,
  body = null,
  entityType = null,
  entityRef = null,
  link = null,
}) => {
  if (!userId || !type || !title) return;

  try {
    await pool.query(
      `INSERT INTO notifications (
        user_id, type, title, body, entity_type, entity_ref, link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, type, title, body, entityType, entityRef, link],
    );
  } catch (error) {
    console.error(
      `[notification] failed to create ${type} for ${userId}: ${error.message}`,
    );
  }
};

// Fans an operational alert out to every platform admin (admin + super_admin).
// Read state is per-admin (one row each), so each admin clears their own. Same
// guarded fire-and-forget contract as createNotification. Admin counts are
// small, so a single INSERT ... SELECT is the whole fan-out.
const notifyAdmins = async ({
  type,
  title,
  body = null,
  entityType = null,
  entityRef = null,
  link = null,
}) => {
  if (!type || !title) return;

  try {
    await pool.query(
      `INSERT INTO notifications (
        user_id, type, title, body, entity_type, entity_ref, link
      )
      SELECT id, $1, $2, $3, $4, $5, $6
      FROM users
      WHERE role IN ('admin', 'super_admin')`,
      [type, title, body, entityType, entityRef, link],
    );
  } catch (error) {
    console.error(
      `[notification] failed to notify admins (${type}): ${error.message}`,
    );
  }
};

export { createNotification, notifyAdmins };
