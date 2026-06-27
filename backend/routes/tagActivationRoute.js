import express from "express";
import {
  lookupTag,
  activateTag,
  myTags,
  deactivateTag,
} from "../controllers/tagActivationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const tagActivationRouter = express.Router();

// Buyers (parents/students) activate and manage their own stickers.
tagActivationRouter.use(protect, allowRoles("parent", "student"));

tagActivationRouter.get("/mine", myTags);
tagActivationRouter.get("/lookup/:value", lookupTag);
tagActivationRouter.post("/activate", activateTag);
tagActivationRouter.post("/:token/deactivate", deactivateTag);

export default tagActivationRouter;
