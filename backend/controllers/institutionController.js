import pool from "../config/db.js";
import bcrypt from "bcrypt";

const getInstitutions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, institution_name, institution_category, institution_type
       FROM institutions
       WHERE status = 'approved'
       ORDER BY institution_name ASC`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const registerInstitution = async (req, res) => {
  try {
    const {
      contact_person_name,
      contact_email,
      contact_number,
      institution_name,
      registration_number,
      institution_phone,
      institution_type,
      institution_category,
      password,
      confirm_password,
    } = req.body;

    console.log("Received registration data:", req.body);
    if (
      !contact_person_name ||
      !contact_email ||
      !contact_number ||
      !institution_name ||
      !institution_phone ||
      !institution_type ||
      !password ||
      !confirm_password ||
      !institution_category
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (!["school", "university"].includes(institution_category)) {
      return res.status(400).json({ message: "Invalid institution category" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingInstitution = await pool.query(
      "SELECT * FROM institutions WHERE contact_email = $1",
      [contact_email],
    );

    if (existingInstitution.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Institution email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const status = ["admin", "super_admin"].includes(req.user?.role)
      ? "approved"
      : "pending";

    const institutionResult = await pool.query(
      `INSERT INTO institutions (
    institution_name,
    institution_category,
    institution_type,
    registration_number,
    contact_person_name,
    contact_email,
    contact_number,
    institution_phone,
    status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING *`,
      [
        institution_name,
        institution_category,
        institution_type,
        registration_number || null,
        contact_person_name,
        contact_email,
        contact_number,
        institution_phone,
        status,
      ],
    );
    const institution = institutionResult.rows[0];
    const userRole = institution_category;

    const userResult = await pool.query(
      `INSERT INTO users (
    role, full_name, email, contact_number, password_hash, institution_id, status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING id, role, full_name, email, contact_number, institution_id, status`,
      [
        userRole,
        contact_person_name,
        contact_email,
        contact_number,
        password_hash,
        institution.id,
        status,
      ],
    );
    res.status(201).json({
      message: "Institution registration successful. Awaiting admin approval.",
      institution,
      user: userResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { getInstitutions, registerInstitution };
