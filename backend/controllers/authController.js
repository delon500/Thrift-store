import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logActivity } from "../services/activityLog.js";
import { notifyAdmins } from "../services/notificationService.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      institution_id: user.institution_id,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

const registerStudentParent = async (req, res) => {
  try {
    const {
      full_name,
      email,
      contact_number,
      institution_id,
      password,
      confirm_password,
      role,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !contact_number ||
      !institution_id ||
      !password ||
      !confirm_password ||
      !role
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "parent"].includes(role)) {
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
      "SELECT * FROM institutions WHERE id = $1",
      [institution_id],
    );
    if (institutionCheck.rows.length === 0) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (role, full_name, email, contact_number, password_hash, institution_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id, role, full_name, email, contact_number, institution_id, status`,
      [role, full_name, email, contact_number, password_hash, institution_id],
    );

    const createdUser = newUser.rows[0];

    logActivity({
      action: "user.register",
      actorId: createdUser.id,
      actorRole: createdUser.role,
      actorName: createdUser.full_name,
      institutionId: createdUser.institution_id,
      entityType: "user",
      entityId: createdUser.id,
      entityRef: createdUser.email,
      description: `${createdUser.full_name} registered as ${createdUser.role}`,
    });

    notifyAdmins({
      type: "registration_pending",
      title: "New registration awaiting approval",
      body: `${createdUser.full_name} registered as a ${createdUser.role}.`,
      entityType: "user",
      entityRef: createdUser.email,
      link: "/admin/registrations",
    });

    res.status(201).json({
      message: "Registration successful. Awaiting admin approval.",
      user: createdUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
      password,
      confirm_password,
      role,
    } = req.body;

    if (
      !contact_person_name ||
      !contact_email ||
      !contact_number ||
      !institution_name ||
      !institution_phone ||
      !institution_type ||
      !password ||
      !confirm_password ||
      !role
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (!["school", "university"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
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

    const institutionResult = await pool.query(
      `INSERT INTO institutions (
        institution_name, institution_type, registration_number,
        contact_person_name, contact_email, contact_number, institution_phone, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        institution_name,
        institution_type,
        registration_number || null,
        contact_person_name,
        contact_email,
        contact_number,
        institution_phone,
      ],
    );

    const institution = institutionResult.rows[0];

    const userResult = await pool.query(
      `INSERT INTO users (
        role, full_name, email, contact_number, password_hash, institution_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, role, full_name, email, contact_number, institution_id, status`,
      [
        role,
        contact_person_name,
        contact_email,
        contact_number,
        password_hash,
        institution.id,
      ],
    );
    const createdUser = userResult.rows[0];

    logActivity({
      action: "user.register",
      actorId: createdUser.id,
      actorRole: role,
      actorName: contact_person_name,
      institutionId: institution.id,
      entityType: "user",
      entityId: createdUser.id,
      entityRef: contact_email,
      description: `${institution_name} registered as ${role}`,
    });

    notifyAdmins({
      type: "registration_pending",
      title: "New registration awaiting approval",
      body: `${institution_name} registered as a ${role}.`,
      entityType: "user",
      entityRef: contact_email,
      link: "/admin/registrations",
    });

    res.status(201).json({
      message: "Institution registration successful. Awaiting admin approval.",
      institution,
      user: createdUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const userResult = await pool.query(
      `
  SELECT 
    users.id,
    users.role,
    users.full_name,
    users.email,
    users.password_hash,
    users.institution_id,
    users.status,
    institutions.institution_name,
    institutions.status AS institution_status
  FROM users
  LEFT JOIN institutions
    ON users.institution_id = institutions.id
  WHERE users.email = $1
  `,
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (
      user.status !== "approved" &&
      !["admin", "super_admin"].includes(user.role)
    ) {
      return res.status(403).json({ message: "Account not yet approved" });
    }

    // A suspended/rejected institution shuts out all of its users.
    if (["suspended", "rejected"].includes(user.institution_status)) {
      return res.status(403).json({
        message:
          "Your institution's account is not active. Please contact support.",
      });
    }

    const token = generateToken(user);

    logActivity({
      action: "user.login",
      actorId: user.id,
      actorRole: user.role,
      actorName: user.full_name,
      institutionId: user.institution_id,
      description: `${user.full_name} signed in`,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        institution_id: user.institution_id,
        institution_name: user.institution_name,
        status: user.status,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const registerAdmin = async (req, res) => {
  try {
    const {
      full_name,
      email,
      contact_number,
      password,
      confirm_password,
      role = "admin",
      institution_id,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !contact_number ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role !== "admin") {
      return res
        .status(400)
        .json({ message: "Only admin role can be created here" });
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

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newAdmin = await pool.query(
      `INSERT INTO users (
        role,
        full_name,
        email,
        contact_number,
        password_hash,
        institution_id,
        status
      )
      VALUES (
        'admin',
        $1,
        $2,
        $3,
        $4,
        NULL,
        'approved'
      )
      RETURNING id, role, full_name, email, contact_number, status`,
      [full_name, email, contact_number, password_hash],
    );

    return res.status(201).json({
      message: "Admin registered successfully",
      user: newAdmin.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('admin', 'super_admin')",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const admin = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    if (admin.status !== "approved") {
      return res.status(403).json({ message: "Admin account not approved" });
    }

    const token = generateToken(admin);

    logActivity({
      action: "user.login",
      actorId: admin.id,
      actorRole: admin.role,
      actorName: admin.full_name,
      institutionId: admin.institution_id,
      description: `${admin.full_name} signed in (admin)`,
    });

    return res.json({
      message: "Admin login successful",
      token,
      user: {
        id: admin.id,
        role: admin.role,
        full_name: admin.full_name,
        email: admin.email,
        institution_id: admin.institution_id,
        status: admin.status,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
export {
  registerStudentParent,
  registerInstitution,
  login,
  adminLogin,
  registerAdmin,
};
