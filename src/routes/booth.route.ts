import { Router } from "express";
import {
  getTodayStateController,
  updateThemeController,
  shootExposureController,
  getDispensedStripController,
} from "../controllers/booth.controller";
import {
  sendInviteController,
  respondInviteController,
  cancelInviteController,
  shootTogetherController,
} from "../controllers/together.controller";
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

// "Shoot together" hand-off: invite the partner to fill an empty slot from
// one shared photo instead of two separate solo exposures.
router.post("/together/invite", sendInviteController);
router.post("/together/respond", respondInviteController);
router.post("/together/cancel", cancelInviteController);
router.post("/exposure/:slotIndex/shoot-together", photoUpload.single("photo"), shootTogetherController);

// Dispensed photobooth strip
router.get("/strip", getDispensedStripController);

export default router;
