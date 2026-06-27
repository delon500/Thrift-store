import express from "express";
import {
  createBatch,
  getBatch,
  listBatches,
} from "../controllers/tagController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const tagRouter = express.Router();

// Admins can view tag batches; only super-admins generate them.
tagRouter.use(protect, allowRoles("admin", "super_admin"));

tagRouter.get("/batches", listBatches);
tagRouter.get("/batches/:id", getBatch);
tagRouter.post("/batches", allowRoles("super_admin"), createBatch);

export default tagRouter;
