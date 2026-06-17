import express from "express";
import {
  deleteInstitution,
  listInstitutions,
  updateInstitution,
} from "../controllers/adminInstitutionController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminInstitutionRouter = express.Router();

adminInstitutionRouter.use(protect, allowRoles("admin", "super_admin"));
adminInstitutionRouter.get("/", listInstitutions);

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
