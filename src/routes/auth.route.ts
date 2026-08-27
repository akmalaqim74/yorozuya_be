import { Router } from "express";
import {
  registerController,
  loginController,
  getMeController,
  updateProfileController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Public auth endpoints with rate limiting
router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);

// Authenticated profile endpoints
router.get("/me", authMiddleware, getMeController);
router.put("/profile", authMiddleware, updateProfileController);

export default router;
