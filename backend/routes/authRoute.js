import express from "express";
import {
  adminLogin,
  login,
  registerAdmin,
  registerInstitution,
  registerStudentParent,
} from "../controllers/authController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register/student-parent", registerStudentParent);
authRouter.post("/register/institution", registerInstitution);
authRouter.post("/login", login);
authRouter.post("/admin/login", adminLogin);
authRouter.post(
  "/admin/register/staff",
  protect,
  allowRoles("admin"),
  registerAdmin,
);

export default authRouter;
