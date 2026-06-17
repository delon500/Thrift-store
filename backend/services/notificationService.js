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

export { createNotification };
