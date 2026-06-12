import bcrypt from "bcrypt";
import pool from "../config/db.js";

const profileSelect = `
  SELECT
    users.id,
    users.role,
    users.full_name,
    users.email,
    users.contact_number,
    users.institution_id,
    users.status,
    users.created_at,
    institutions.institution_name,
    institutions.institution_category,
    institutions.institution_type,
    institutions.status AS institution_status
  FROM users
  LEFT JOIN institutions ON institutions.id = users.institution_id
  WHERE users.id = $1
`;

const buildUserProfile = (row) => ({
  id: row.id,
  role: row.role,
  full_name: row.full_name,
  email: row.email,
  contact_number: row.contact_number,
  institution_id: row.institution_id,
  status: row.status,
  created_at: row.created_at,
  institution_name: row.institution_name,
  institution_category: row.institution_category,
  institution_type: row.institution_type,
  institution_status: row.institution_status,
});

const getEditableProfileFields = (body) => {
  const fields = {};

  if (typeof body.full_name === "string" && body.full_name.trim()) {
    fields.full_name = body.full_name.trim();
  }

  if (typeof body.contact_number === "string" && body.contact_number.trim()) {
    fields.contact_number = body.contact_number.trim();
  }

  return fields;
};

const validatePasswordChange = ({
  current_password,
  new_password,
  confirm_password,
}) => {
  if (!current_password || !new_password) {
    return "Current password and new password are required";
  }

  if (new_password.length < 8) {
    return "New password must be at least 8 characters";
  }

  if (confirm_password && new_password !== confirm_password) {
    return "New passwords do not match";
  }

  return null;
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(profileSelect, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: buildUserProfile(result.rows[0]) });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const fields = getEditableProfileFields(req.body);
    const entries = Object.entries(fields);

    if (entries.length === 0) {
      return res.status(400).json({
        message: "Provide full_name or contact_number to update",
      });
    }

    const setClause = entries
      .map(([field], index) => `${field} = $${index + 1}`)
      .join(", ");
    const values = entries.map(([, value]) => value);

    await pool.query(
      `UPDATE users
       SET ${setClause}, updated_at = now()
       WHERE id = $${values.length + 1}`,
      [...values, req.user.id],
    );

    const result = await pool.query(profileSelect, [req.user.id]);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildUserProfile(result.rows[0]),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const validationError = validatePasswordChange(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { current_password, new_password } = req.body;
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
      [password_hash, req.user.id],
    );

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export {
  buildUserProfile,
  changePassword,
  getEditableProfileFields,
  getMe,
  updateMe,
  validatePasswordChange,
};
