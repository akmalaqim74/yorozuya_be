import { Router } from "express";
import {
  getTodayStateController,
  updateThemeController,
  shootExposureController,
  getDispensedStripController,
} from "../controllers/booth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { photoUpload } from "../middleware/upload.middleware";

const router = Router();

// All booth routes require authentication
router.use(authMiddleware);

// Today's booth state
router.get("/today", getTodayStateController);

// Pick look & paper & stickers
router.post("/theme", updateThemeController);

// Shoot & upload photo for slot (0: morning, 1: noon, 2: evening, 3: night)
router.post("/exposure/:slotIndex/shoot", photoUpload.single("photo"), shootExposureController);

// Dispensed photobooth strip
router.get("/strip", getDispensedStripController);

export default router;
