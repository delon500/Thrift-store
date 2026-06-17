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

adminRouter.use(protect, allowRoles("admin", "super_admin"));
adminRouter.get("/stats", getDashboardStats);
adminRouter.get("/logs", listActivityLogs);
adminRouter.get("/users", listUsersByRole);

// Managing users is super-admin only.
adminRouter.patch("/users/:id", allowRoles("super_admin"), updateUser);
adminRouter.post(
  "/users/:id/reset-password",
  allowRoles("super_admin"),
  resetUserPassword,
);
adminRouter.delete("/users/:id", allowRoles("super_admin"), deleteUser);

export default adminRouter;
