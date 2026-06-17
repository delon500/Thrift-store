import pool from "../config/db.js";
import {
  sendApprovalEmail,
  sendRejectionEmail,
} from "../services/emailService.js";
import { logActivity } from "../services/activityLog.js";
import { createNotification } from "../services/notificationService.js";

const INSTITUTION_ROLES = ["school", "university"];

// GET /api/admin/registrations — public sign-ups still awaiting a decision.
const listPendingRegistrations = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.role,
        u.full_name,
        u.email,
        u.contact_number,
        u.status,
        u.created_at,
        u.institution_id,
        i.institution_name,
        i.institution_type
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       WHERE u.status = 'pending'
       ORDER BY u.created_at DESC`,
    );

    return res.json({ registrations: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch registrations", error: error.message });
  }
};

// Flips a still-pending user (and, for school/university contacts, their linked
// institution) to the given decision. Returns the user so the caller can email.
const processRegistration = async (userId, decision) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id, role, full_name, email, institution_id, status
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_found" };
    }

    const user = userResult.rows[0];

    if (user.status !== "pending") {
      await client.query("ROLLBACK");
      return { ok: false, reason: "already_processed", status: user.status };
    }

    await client.query("UPDATE users SET status = $2 WHERE id = $1", [
      user.id,
      decision,
    ]);

    if (INSTITUTION_ROLES.includes(user.role) && user.institution_id) {
      await client.query("UPDATE institutions SET status = $2 WHERE id = $1", [
        user.institution_id,
        decision,
      ]);
    }

    await client.query("COMMIT");

    return { ok: true, user: { ...user, status: decision } };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const respondToResult = (res, result) => {
  if (result.reason === "not_found") {
    return res.status(404).json({ message: "Registration not found" });
  }

  // already approved/rejected
  return res
    .status(409)
    .json({ message: `Registration was already ${result.status}` });
};

// PATCH /api/admin/registrations/:userId/approve
const approveRegistration = async (req, res) => {
  try {
    const result = await processRegistration(req.params.userId, "approved");

    if (!result.ok) return respondToResult(res, result);

    // Email failures are swallowed inside the service so approval still succeeds.
    await sendApprovalEmail(result.user);

    logActivity({
      action: "registration.approved",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: result.user.institution_id,
      entityType: "user",
      entityId: result.user.id,
      entityRef: result.user.email,
      description: `Approved ${result.user.full_name} (${result.user.role})`,
    });

    createNotification({
      userId: result.user.id,
      type: "registration_approved",
      title: "Your account was approved",
      body: "You can now browse and buy items from your institution.",
      entityType: "user",
      entityRef: result.user.email,
      link: "/products",
    });

    return res.json({ message: "Registration approved", user: result.user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to approve registration", error: error.message });
  }
};

// PATCH /api/admin/registrations/:userId/reject
const rejectRegistration = async (req, res) => {
  try {
    const result = await processRegistration(req.params.userId, "rejected");

    if (!result.ok) return respondToResult(res, result);

    await sendRejectionEmail(result.user);

    logActivity({
      action: "registration.rejected",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: result.user.institution_id,
      entityType: "user",
      entityId: result.user.id,
      entityRef: result.user.email,
      description: `Rejected ${result.user.full_name} (${result.user.role})`,
    });

    return res.json({ message: "Registration rejected", user: result.user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to reject registration", error: error.message });
  }
};

export { approveRegistration, listPendingRegistrations, rejectRegistration };
