import express from "express";
import {
  approveRegistration,
  listPendingRegistrations,
  rejectRegistration,
} from "../controllers/registrationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const registrationRouter = express.Router();

registrationRouter.use(protect, allowRoles("admin"));
registrationRouter.get("/", listPendingRegistrations);
registrationRouter.patch("/:userId/approve", approveRegistration);
registrationRouter.patch("/:userId/reject", rejectRegistration);

export default registrationRouter;
