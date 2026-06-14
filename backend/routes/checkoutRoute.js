import express from "express";
import {
  cancelCheckout,
  createCheckout,
  getPaymentMethods,
} from "../controllers/checkoutController.js";
import { protect } from "../middleware/authMiddleware.js";

const checkoutRouter = express.Router();

checkoutRouter.get("/payment-methods", protect, getPaymentMethods);
checkoutRouter.post("/create", protect, createCheckout);
checkoutRouter.post("/:orderReference/cancel", protect, cancelCheckout);

export default checkoutRouter;
