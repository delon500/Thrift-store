import pool from "../config/db.js";
import { logActivity } from "../services/activityLog.js";

const getParent = async (id) => {
  const r = await pool.query(
    "SELECT id, full_name, institution_id FROM users WHERE id = $1 AND role = 'parent'",
    [id],
  );
  return r.rows[0] || null;
};

// GET /api/admin/parents/:parentId/students — students linked to this parent,
// plus the students in the same institution that could still be linked.
const listForParent = async (req, res) => {
  try {
    const parent = await getParent(req.params.parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    const linked = await pool.query(
      `SELECT u.id, u.full_name, u.email
       FROM guardianship g
       JOIN users u ON u.id = g.student_user_id
       WHERE g.guardian_user_id = $1
       ORDER BY u.full_name`,
      [parent.id],
    );
    const available = await pool.query(
      `SELECT u.id, u.full_name, u.email
       FROM users u
       WHERE u.role = 'student'
         AND u.institution_id = $1
         AND u.id NOT IN (
           SELECT student_user_id FROM guardianship WHERE guardian_user_id = $2
         )
       ORDER BY u.full_name`,
      [parent.institution_id, parent.id],
    );

    return res.json({
      parent: { id: parent.id, full_name: parent.full_name },
      linked: linked.rows,
      available: available.rows,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load links", error: error.message });
  }
};

// POST /api/admin/parents/:parentId/students  body: { student_user_id }
const linkStudent = async (req, res) => {
  try {
    const parent = await getParent(req.params.parentId);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    const { student_user_id } = req.body;
    if (!student_user_id) {
      return res.status(400).json({ message: "student_user_id is required" });
    }

    const student = await pool.query(
      "SELECT id, full_name, institution_id FROM users WHERE id = $1 AND role = 'student'",
      [student_user_id],
    );
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.rows[0].institution_id !== parent.institution_id) {
      return res
        .status(400)
        .json({ message: "Student and parent must be in the same institution" });
    }

    try {
      await pool.query(
        "INSERT INTO guardianship (guardian_user_id, student_user_id) VALUES ($1, $2)",
        [parent.id, student_user_id],
      );
    } catch (e) {
      if (e.code === "23505") {
        return res.status(409).json({ message: "Already linked" });
      }
      throw e;
    }

    logActivity({
      action: "guardianship.linked",
      actorId: req.user.id,
      actorRole: req.user.role,
      institutionId: parent.institution_id,
      entityType: "guardianship",
      entityRef: parent.id,
      description: `Linked student ${student.rows[0].full_name} to parent ${parent.full_name}`,
    });

    return res.status(201).json({ message: "Linked" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to link student", error: error.message });
  }
};

// DELETE /api/admin/parents/:parentId/students/:studentId
const unlinkStudent = async (req, res) => {
  try {
    const r = await pool.query(
      "DELETE FROM guardianship WHERE guardian_user_id = $1 AND student_user_id = $2 RETURNING student_user_id",
      [req.params.parentId, req.params.studentId],
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Link not found" });
    }
    logActivity({
      action: "guardianship.unlinked",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "guardianship",
      entityRef: req.params.parentId,
      description: "Unlinked a student from a parent",
    });
    return res.json({ message: "Unlinked" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to unlink", error: error.message });
  }
};

export { listForParent, linkStudent, unlinkStudent };
