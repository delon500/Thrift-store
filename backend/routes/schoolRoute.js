import express from "express";
import {
  getDashboardStats,
  listSchoolOrders,
  getOrderDetail,
  getSchoolProducts,
  lookupByReference,
  markCollected,
} from "../controllers/schoolController.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  analyseProduct,
} from "../controllers/productController.js";
import {
  reportFound,
  listFoundReports,
  markReturned,
} from "../controllers/foundReportController.js";
import upload from "../middleware/multer.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const schoolRouter = express.Router();

// Up to 5 product images, matching the admin add-item form.
const productImageUpload = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
]);

schoolRouter.use(protect, allowRoles("school", "university"));
schoolRouter.get("/dashboard", getDashboardStats);
schoolRouter.get("/products", getSchoolProducts);
schoolRouter.get("/orders", listSchoolOrders);
schoolRouter.get("/lookup", lookupByReference);
schoolRouter.get("/orders/:orderReference", getOrderDetail);
schoolRouter.patch("/orders/:orderReference/collect", markCollected);

// Item management for the staff's own institution. createProduct forces the
// product's institution to the staff's; update/delete are ownership-scoped.
schoolRouter.post("/products", productImageUpload, createProduct);
schoolRouter.post("/products/analyze", productImageUpload, analyseProduct);
schoolRouter.patch("/products/:id", updateProduct);
schoolRouter.delete("/products/:id", deleteProduct);

// Lost & found: scan/enter an active tag to report a found item, list reports,
// and mark one returned.
schoolRouter.post("/found-reports", reportFound);
schoolRouter.get("/found-reports", listFoundReports);
schoolRouter.patch("/found-reports/:id/return", markReturned);

export default schoolRouter;
