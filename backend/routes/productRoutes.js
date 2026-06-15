import express from "express";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import {
  createProduct,
  analyseProduct,
  getProducts,
  listAdminProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";

const productRouter = express.Router();

productRouter.post(
  "/analyze",
  protect,
  allowRoles("admin"),
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  analyseProduct,
);
productRouter.post(
  "/",
  protect,
  allowRoles("admin"),
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
  ]),
  createProduct,
);
productRouter.get("/", protect, getProducts);

// Admin inventory management
productRouter.get("/admin", protect, allowRoles("admin"), listAdminProducts);
productRouter.patch("/:id", protect, allowRoles("admin"), updateProduct);
productRouter.delete("/:id", protect, allowRoles("admin"), deleteProduct);

export default productRouter;
