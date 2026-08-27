import { Router } from "express";
import { getUsStatsController } from "../controllers/stats.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All stats routes require authentication
router.use(authMiddleware);

// "Us" statistics & habit breakdown
router.get("/us", getUsStatsController);

export default router;
