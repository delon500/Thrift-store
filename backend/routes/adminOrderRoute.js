import express from "express";
import {
  cancelOrder,
  getOrder,
  listOrders,
  markCollected,
  refundOrder,
} from "../controllers/adminOrderController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminOrderRouter = express.Router();

adminOrderRouter.use(protect, allowRoles("admin"));
adminOrderRouter.get("/", listOrders);
adminOrderRouter.get("/:orderReference", getOrder);
adminOrderRouter.patch("/:orderReference/collect", markCollected);
adminOrderRouter.post("/:orderReference/cancel", cancelOrder);
adminOrderRouter.post("/:orderReference/refund", refundOrder);

export default adminOrderRouter;
