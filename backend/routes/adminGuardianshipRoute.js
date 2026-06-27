import express from "express";
import {
  listForParent,
  linkStudent,
  unlinkStudent,
} from "../controllers/guardianshipController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminGuardianshipRouter = express.Router();

// Admins can view a parent's linked students; only super-admins change links.
adminGuardianshipRouter.use(protect, allowRoles("admin", "super_admin"));

adminGuardianshipRouter.get("/:parentId/students", listForParent);
adminGuardianshipRouter.post(
  "/:parentId/students",
  allowRoles("super_admin"),
  linkStudent,
);
adminGuardianshipRouter.delete(
  "/:parentId/students/:studentId",
  allowRoles("super_admin"),
  unlinkStudent,
);

export default adminGuardianshipRouter;
