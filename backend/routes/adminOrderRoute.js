import express from "express";
import {
  getOrder,
  listOrders,
  markCollected,
} from "../controllers/adminOrderController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const adminOrderRouter = express.Router();

adminOrderRouter.use(protect, allowRoles("admin"));
adminOrderRouter.get("/", listOrders);
adminOrderRouter.get("/:orderReference", getOrder);
adminOrderRouter.patch("/:orderReference/collect", markCollected);

export default adminOrderRouter;
