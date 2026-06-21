import express from "express";
import {
  getDashboardStats,
  listSchoolOrders,
  getOrderDetail,
  getSchoolProducts,
  lookupByReference,
  markCollected,
} from "../controllers/schoolController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const schoolRouter = express.Router();

schoolRouter.use(protect, allowRoles("school", "university"));
schoolRouter.get("/dashboard", getDashboardStats);
schoolRouter.get("/products", getSchoolProducts);
schoolRouter.get("/orders", listSchoolOrders);
schoolRouter.get("/lookup", lookupByReference);
schoolRouter.get("/orders/:orderReference", getOrderDetail);
schoolRouter.patch("/orders/:orderReference/collect", markCollected);

export default schoolRouter;
