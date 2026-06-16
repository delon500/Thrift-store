import express from "express";
import {
  adminLogin,
  login,
  registerAdmin,
  registerInstitution,
  registerStudentParent,
} from "../controllers/authController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimit.js";

const authRouter = express.Router();

authRouter.post("/register/student-parent", registerStudentParent);
authRouter.post("/register/institution", registerInstitution);
authRouter.post("/login", loginLimiter, login);
authRouter.post("/admin/login", loginLimiter, adminLogin);
authRouter.post(
  "/admin/register/staff",
  protect,
  allowRoles("super_admin"),
  registerAdmin,
);

export default authRouter;
