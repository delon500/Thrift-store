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

adminOrderRouter.use(protect, allowRoles("admin", "super_admin"));
adminOrderRouter.get("/", listOrders);
adminOrderRouter.get("/:orderReference", getOrder);
adminOrderRouter.patch("/:orderReference/collect", markCollected);
adminOrderRouter.post("/:orderReference/cancel", cancelOrder);

// Refunds move money — super-admin only.
adminOrderRouter.post(
  "/:orderReference/refund",
  allowRoles("super_admin"),
  refundOrder,
);

export default adminOrderRouter;
