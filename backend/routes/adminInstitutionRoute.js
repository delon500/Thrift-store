import express from "express";
import {
  deleteInstitution,
  listInstitutions,
  updateInstitution,
  getInstitutionSettings,
  updateInstitutionSettings,
} from "../controllers/adminInstitutionController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminInstitutionRouter = express.Router();

adminInstitutionRouter.use(protect, allowRoles("admin", "super_admin"));
adminInstitutionRouter.get("/", listInstitutions);

// Per-institution settings: admin can read, super-admin can edit.
adminInstitutionRouter.get("/:id/settings", getInstitutionSettings);
adminInstitutionRouter.put(
  "/:id/settings",
  allowRoles("super_admin"),
  updateInstitutionSettings,
);

// Editing / deleting institutions is super-admin only.
adminInstitutionRouter.patch(
  "/:id",
  allowRoles("super_admin"),
  updateInstitution,
);
adminInstitutionRouter.delete(
  "/:id",
  allowRoles("super_admin"),
  deleteInstitution,
);

export default adminInstitutionRouter;
