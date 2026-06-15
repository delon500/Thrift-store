import pool from "../config/db.js";

// Records one activity-log row. Fire-and-forget and fully guarded: logging must
// never break or slow down the action that triggered it.
const logActivity = async ({
  action,
  actorId = null,
  actorRole = null,
  actorName = null,
  institutionId = null,
  entityType = null,
  entityId = null,
  entityRef = null,
  description = null,
  metadata = null,
}) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (
        action, actor_id, actor_role, actor_name, institution_id,
        entity_type, entity_id, entity_ref, description, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        action,
        actorId,
        actorRole,
        actorName,
        institutionId,
        entityType,
        entityId,
        entityRef,
        description,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (error) {
    console.error(`[activityLog] failed to record ${action}: ${error.message}`);
  }
};

export { logActivity };
