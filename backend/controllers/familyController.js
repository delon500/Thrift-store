import pool from "../config/db.js";

// GET /api/parents/me/children — the signed-in parent's dependents:
// child profiles they manage + student accounts an admin has linked to them.
const listFamily = async (req, res) => {
  try {
    const guardianId = req.user.id;
    const children = await pool.query(
      `SELECT id, full_name, grade, institution_id, created_at
       FROM child_profiles
       WHERE guardian_user_id = $1
       ORDER BY created_at`,
      [guardianId],
    );
    const students = await pool.query(
      `SELECT u.id, u.full_name, u.email
       FROM guardianship g
       JOIN users u ON u.id = g.student_user_id
       WHERE g.guardian_user_id = $1
       ORDER BY u.full_name`,
      [guardianId],
    );
    return res.json({ children: children.rows, students: students.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load family", error: error.message });
  }
};

// POST /api/parents/me/children — add a child profile (no login; alerts go to
// the guardian). Scoped to the parent's own institution.
const createChild = async (req, res) => {
  try {
    const { full_name, grade } = req.body;
    if (!full_name || !String(full_name).trim()) {
      return res.status(400).json({ message: "A name is required" });
    }
    if (!req.user.institution_id) {
      return res
        .status(400)
        .json({ message: "Your account is not linked to an institution" });
    }
    const result = await pool.query(
      `INSERT INTO child_profiles (guardian_user_id, full_name, grade, institution_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, grade, institution_id, created_at`,
      [
        req.user.id,
        String(full_name).trim(),
        grade ? String(grade).trim() : null,
        req.user.institution_id,
      ],
    );
    return res.status(201).json({ child: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add child", error: error.message });
  }
};

// PATCH /api/parents/me/children/:id — update a child profile the parent owns.
const updateChild = async (req, res) => {
  try {
    const { full_name, grade } = req.body;
    if (full_name !== undefined && !String(full_name).trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    const result = await pool.query(
      `UPDATE child_profiles
       SET full_name = COALESCE($1, full_name),
           grade = COALESCE($2, grade)
       WHERE id = $3 AND guardian_user_id = $4
       RETURNING id, full_name, grade, institution_id, created_at`,
      [
        full_name !== undefined ? String(full_name).trim() : null,
        grade !== undefined ? String(grade).trim() : null,
        req.params.id,
        req.user.id,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Child not found" });
    }
    return res.json({ child: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update child", error: error.message });
  }
};

// DELETE /api/parents/me/children/:id — remove a child profile. Any tag bound to
// it is unbound (item_tags.owner_child_id FK is ON DELETE SET NULL).
const deleteChild = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM child_profiles
       WHERE id = $1 AND guardian_user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Child not found" });
    }
    return res.json({ message: "Child removed", id: result.rows[0].id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to remove child", error: error.message });
  }
};

export { listFamily, createChild, updateChild, deleteChild };
