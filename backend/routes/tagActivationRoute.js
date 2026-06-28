import express from "express";
import {
  lookupTag,
  activateTag,
  myTags,
  deactivateTag,
} from "../controllers/tagActivationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { tagActivationLimiter } from "../middleware/rateLimit.js";

const tagActivationRouter = express.Router();

// Buyers (parents/students) activate and manage their own stickers.
tagActivationRouter.use(protect, allowRoles("parent", "student"));

tagActivationRouter.get("/mine", myTags);
// Lookup + activate are rate-limited: the sequential codes are guessable, so
// throttling stops enumeration (harvesting labels / claiming unclaimed tags).
tagActivationRouter.get("/lookup/:value", tagActivationLimiter, lookupTag);
tagActivationRouter.post("/activate", tagActivationLimiter, activateTag);
tagActivationRouter.post("/:token/deactivate", deactivateTag);

export default tagActivationRouter;
