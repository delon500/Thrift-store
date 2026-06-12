import express from "express";
import {
  addCartItem,
  checkoutCart,
  clearCart,
  getCart,
  removeCartItem,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const cartRouter = express.Router();

cartRouter.get("/", protect, getCart);
cartRouter.post("/items", protect, addCartItem);
cartRouter.delete("/items/:cartItemId", protect, removeCartItem);
cartRouter.delete("/", protect, clearCart);
cartRouter.post("/checkout", protect, checkoutCart);

export default cartRouter;
