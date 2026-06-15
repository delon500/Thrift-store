import express from "express";
import {
  getDashboardStats,
  listActivityLogs,
  listUsersByRole,
} from "../controllers/adminController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.use(protect, allowRoles("admin"));
adminRouter.get("/stats", getDashboardStats);
adminRouter.get("/logs", listActivityLogs);
adminRouter.get("/users", listUsersByRole);

export default adminRouter;
