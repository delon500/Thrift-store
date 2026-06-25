import express from "express";
import {
  confirmPayment,
  payfastItn,
  paymentWebhook,
  reconcileOrder,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/confirm", protect, confirmPayment);
paymentRouter.post("/payfast/itn", express.urlencoded({ extended: false }), payfastItn);
paymentRouter.post("/webhook", paymentWebhook);
paymentRouter.post("/:orderReference/reconcile", protect, reconcileOrder);

export default paymentRouter;
