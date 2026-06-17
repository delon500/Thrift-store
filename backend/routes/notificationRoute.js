import express from "express";
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const notificationRouter = express.Router();

notificationRouter.use(protect);

notificationRouter.get("/", listNotifications);
notificationRouter.get("/unread-count", unreadCount);
notificationRouter.patch("/read-all", markAllRead);
notificationRouter.patch("/:id/read", markRead);

export default notificationRouter;
