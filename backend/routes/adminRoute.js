import express from "express";
import {
  deleteUser,
  getDashboardStats,
  listActivityLogs,
  listUsersByRole,
  resetUserPassword,
  updateUser,
} from "../controllers/adminController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.use(protect, allowRoles("admin"));
adminRouter.get("/stats", getDashboardStats);
adminRouter.get("/logs", listActivityLogs);
adminRouter.get("/users", listUsersByRole);
adminRouter.patch("/users/:id", updateUser);
adminRouter.post("/users/:id/reset-password", resetUserPassword);
adminRouter.delete("/users/:id", deleteUser);

export default adminRouter;
