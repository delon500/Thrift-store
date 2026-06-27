import express from "express";
import { registerParent } from "../controllers/parentController.js";
import {
  listFamily,
  createChild,
  updateChild,
  deleteChild,
} from "../controllers/familyController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const parentRouter = express.Router();

parentRouter.post("/register", protect, allowRoles("super_admin"), registerParent);

// A signed-in parent manages their own child profiles.
parentRouter.get("/me/children", protect, allowRoles("parent"), listFamily);
parentRouter.post("/me/children", protect, allowRoles("parent"), createChild);
parentRouter.patch(
  "/me/children/:id",
  protect,
  allowRoles("parent"),
  updateChild,
);
parentRouter.delete(
  "/me/children/:id",
  protect,
  allowRoles("parent"),
  deleteChild,
);

export default parentRouter;
