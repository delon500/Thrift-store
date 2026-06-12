import express from "express";
import {
  changePassword,
  getMe,
  updateMe,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.get("/me", protect, getMe);
userRouter.patch("/me", protect, updateMe);
userRouter.patch("/me/password", protect, changePassword);

export default userRouter;
