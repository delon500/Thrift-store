import express from "express";
import {
  getInstitutions,
  registerInstitution,
} from "../controllers/institutionController.js";

import { protect, allowRoles } from "../middleware/authMiddleware.js";

const institutionRouter = express.Router();

institutionRouter.get("/", getInstitutions);
institutionRouter.post(
  "/admin/register/institution",
  protect,
  allowRoles("admin"),
  registerInstitution,
);

export default institutionRouter;
