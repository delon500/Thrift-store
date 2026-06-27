import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";
import { sendFoundItemEmail } from "../services/emailService.js";

// POST /api/school/found-reports — staff scan/enter an active tag (token or code)
// on a lost item. Records a found report, flips the tag to reported_found, and
// emails the owner (a user, or the guardian of a child). The response carries no
// owner PII — only the label + LF reference for the staff member.
const reportFound = async (req, res) => {
  const client = await pool.connect();
  try {
    const { value } = req.body;
    if (!value) return res.status(400).json({ message: "A sticker code is required" });

    const tagRes = await client.query(
      `SELECT t.id, t.status, t.label, t.code, t.institution_id,
              i.institution_name,
              t.owner_user_id, ou.email AS owner_email, ou.full_name AS owner_name,
              t.owner_child_id, cp.full_name AS child_name,
              gu.email AS guardian_email, gu.full_name AS guardian_name
       FROM item_tags t
       JOIN institutions i ON i.id = t.institution_id
       LEFT JOIN users ou ON ou.id = t.owner_user_id
       LEFT JOIN child_profiles cp ON cp.id = t.owner_child_id
       LEFT JOIN users gu ON gu.id = cp.guardian_user_id
       WHERE t.token = $1 OR t.code = $1`,
      [value],
    );
    if (tagRes.rows.length === 0) {
      return res.status(404).json({ message: "Sticker not found" });
    }
    const tag = tagRes.rows[0];

    if (tag.institution_id !== req.user.institution_id) {
      return res
        .status(403)
        .json({ message: "This sticker belongs to a different institution" });
    }
    if (tag.status === "unactivated") {
      return res.status(409).json({
        message: "This sticker hasn't been activated yet — there's no one to notify",
      });
    }
    if (tag.status === "reported_found") {
      return res
        .status(409)
        .json({ message: "This item has already been reported found" });
    }
    if (tag.status !== "active") {
      return res
        .status(409)
        .json({ message: "This sticker can't be reported right now" });
    }

    await client.query("BEGIN");
    const report = await client.query(
      `INSERT INTO found_reports (tag_id, institution_id, found_by_user_id)
       VALUES ($1, $2, $3)
       RETURNING reference, status`,
      [tag.id, tag.institution_id, req.user.id],
    );
    await client.query(
      "UPDATE item_tags SET status = 'reported_found' WHERE id = $1",
      [tag.id],
    );
    await client.query("COMMIT");

    const reference = report.rows[0].reference;
    const to = tag.owner_user_id ? tag.owner_email : tag.guardian_email;
    const name = tag.owner_user_id ? tag.owner_name : tag.guardian_name;
    let emailed = false;
    if (to) {
      const r = await sendFoundItemEmail({
        to,
        recipientName: name,
        label: tag.label,
        institutionName: tag.institution_name,
        reference,
        childName: tag.owner_child_id ? tag.child_name : null,
      });
      emailed = r?.sent === true;
    }

    logActivity({
      action: "found_report.created",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: tag.institution_id,
      entityType: "found_report",
      entityRef: reference,
      description: `Found item reported (${tag.code})`,
    });

    return res.status(201).json({
      reference,
      label: tag.label,
      status: report.rows[0].status,
      emailed,
      message: emailed
        ? "Owner notified"
        : "Reported — but no contact email on file",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    return res
      .status(500)
      .json({ message: "Failed to report found item", error: error.message });
  } finally {
    client.release();
  }
};

// GET /api/school/found-reports — the institution's Lost & Found list (open first).
const listFoundReports = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT fr.id, fr.reference, fr.status, fr.found_at, fr.returned_at,
              t.code, t.label, u.full_name AS found_by
       FROM found_reports fr
       JOIN item_tags t ON t.id = fr.tag_id
       LEFT JOIN users u ON u.id = fr.found_by_user_id
       WHERE fr.institution_id = $1
       ORDER BY (fr.status = 'open') DESC, fr.found_at DESC`,
      [req.user.institution_id],
    );
    return res.json({ reports: r.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load found items", error: error.message });
  }
};

// PATCH /api/school/found-reports/:id/return — handed back to the owner. Frees
// the tag back to 'active' so the same sticker can be found again later.
const markReturned = async (req, res) => {
  const client = await pool.connect();
  try {
    const fr = await client.query(
      "SELECT id, tag_id, status FROM found_reports WHERE id = $1 AND institution_id = $2",
      [req.params.id, req.user.institution_id],
    );
    if (fr.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (fr.rows[0].status === "returned") {
      return res.status(409).json({ message: "Already returned" });
    }

    await client.query("BEGIN");
    await client.query(
      "UPDATE found_reports SET status = 'returned', returned_at = now() WHERE id = $1",
      [req.params.id],
    );
    await client.query(
      "UPDATE item_tags SET status = 'active' WHERE id = $1",
      [fr.rows[0].tag_id],
    );
    await client.query("COMMIT");

    logActivity({
      action: "found_report.returned",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: req.user.institution_id,
      entityType: "found_report",
      entityRef: req.params.id,
      description: "Found item returned to its owner",
    });
    return res.json({ message: "Marked as returned" });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    return res
      .status(500)
      .json({ message: "Failed to mark returned", error: error.message });
  } finally {
    client.release();
  }
};

export { reportFound, listFoundReports, markReturned };
