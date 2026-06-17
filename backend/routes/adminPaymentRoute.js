import express from "express";
import {
  getPayment,
  listPayments,
  recoverPayment,
} from "../controllers/adminPaymentController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminPaymentRouter = express.Router();

adminPaymentRouter.use(protect, allowRoles("admin", "super_admin"));
adminPaymentRouter.get("/", listPayments);
adminPaymentRouter.get("/:id", getPayment);

// Recovering a stuck-but-paid order is super-admin only.
adminPaymentRouter.post(
  "/:orderReference/recover",
  allowRoles("super_admin"),
  recoverPayment,
);

export default adminPaymentRouter;
