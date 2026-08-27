import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.util";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, "Too many requests. Please slow down.", 429, "RATE_LIMIT_EXCEEDED");
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 login/register attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, "Too many authentication attempts. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
  },
});
