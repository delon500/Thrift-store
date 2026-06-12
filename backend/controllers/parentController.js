import pool from "../config/db.js";
import bcrypt from "bcrypt";

const registerParent = async (req, res) => {
  try {
    const {
      full_name,
      email,
      contact_number,
      institution_id,
      password,
      confirm_password,
    } = req.body;
    const role = "parent";
    if (
      !full_name ||
      !email ||
      !contact_number ||
      !institution_id ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role !== "parent") {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const institutionCheck = await pool.query(
      "SELECT id, status FROM institutions WHERE id = $1",
      [institution_id],
    );

    if (institutionCheck.rows.length === 0) {
      return res.status(404).json({ message: "Institution not found" });
    }

    if (institutionCheck.rows[0].status !== "approved") {
      return res
        .status(400)
        .json({ message: "Selected institution is not approved" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (
        role,
        full_name,
        email,
        contact_number,
        password_hash,
        institution_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, role, full_name, email, contact_number, institution_id, status`,
      [role, full_name, email, contact_number, password_hash, institution_id],
    );

    return res.status(201).json({
      message: "Parent registration successful. Awaiting approval.",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export { registerParent };
