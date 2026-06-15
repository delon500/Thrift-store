import express from "express";
import { getMyOrder, listMyOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const orderRouter = express.Router();

orderRouter.get("/", protect, listMyOrders);
orderRouter.get("/:orderReference", protect, getMyOrder);

export default orderRouter;
