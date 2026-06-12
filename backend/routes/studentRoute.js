import express from "express";
import { registerStudent } from "../controllers/StudentController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const studentRouter = express.Router();
studentRouter.post(
  "/admin/register/student",
  protect,
  allowRoles("admin"),
  registerStudent,
);

export default studentRouter;
