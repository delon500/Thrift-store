import express from "express";
import {
  getAppSettings,
  updateAppSettings,
} from "../controllers/adminSettingsController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminSettingsRouter = express.Router();

adminSettingsRouter.use(protect, allowRoles("admin", "super_admin"));

adminSettingsRouter.get("/", getAppSettings);
adminSettingsRouter.put("/", allowRoles("super_admin"), updateAppSettings);

export default adminSettingsRouter;
