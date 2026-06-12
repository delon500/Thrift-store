import express from "express";
import {
  createCheckout,
  getPaymentMethods,
} from "../controllers/checkoutController.js";
import { protect } from "../middleware/authMiddleware.js";

const checkoutRouter = express.Router();

checkoutRouter.get("/payment-methods", protect, getPaymentMethods);
checkoutRouter.post("/create", protect, createCheckout);

export default checkoutRouter;
