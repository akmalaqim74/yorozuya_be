import { Router } from "express";
import {
  getMonthDrawerController,
  getStripDetailsController,
  toggleZineStatusController,
} from "../controllers/archive.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All archive routes require authentication
router.use(authMiddleware);

// The Drawer monthly grid
router.get("/drawer", getMonthDrawerController);

// Specific strip details
router.get("/strip/:rollId", getStripDetailsController);

// Toggle zine bookmark
router.post("/strip/:rollId/zine", toggleZineStatusController);

export default router;
