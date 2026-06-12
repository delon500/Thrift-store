import express from "express";
import { registerParent } from "../controllers/parentController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const parentRouter = express.Router();

parentRouter.post("/register", protect, allowRoles("admin"), registerParent);

export default parentRouter;
