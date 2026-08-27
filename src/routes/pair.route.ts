import { Router } from "express";
import {
  createInviteController,
  joinPairController,
  getStatusController,
  disconnectController,
} from "../controllers/pair.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All pairing routes require authentication
router.use(authMiddleware);

router.post("/invite", createInviteController);
router.post("/join", joinPairController);
router.get("/status", getStatusController);
router.post("/disconnect", disconnectController);

export default router;
