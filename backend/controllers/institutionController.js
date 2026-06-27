import pool from "../config/db.js";

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

// Registers an institution as a RECORD ONLY — no login/password. Accounts for
// the institution are created separately (see adminInstitutionController
// createInstitutionUser). Admin-only, so it's approved on creation.
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
    } = req.body;

    if (
      !contact_person_name ||
      !contact_email ||
      !contact_number ||
      !institution_name ||
      !institution_phone ||
      !institution_type ||
      !institution_category
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (!["school", "university"].includes(institution_category)) {
      return res.status(400).json({ message: "Invalid institution category" });
    }

    const existingInstitution = await pool.query(
      "SELECT id FROM institutions WHERE contact_email = $1",
      [contact_email],
    );

    if (existingInstitution.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Institution email already exists" });
    }

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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')
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
      ],
    );

    return res.status(201).json({
      message: "Institution registered. You can now add accounts for it.",
      institution: institutionResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { getInstitutions, registerInstitution };
