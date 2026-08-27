import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/env";
import routes from "./routes";
import { requestLogger } from "./middleware/logger.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { sendError, sendSuccess } from "./utils/response.util";

const app = express();

// Trust reverse proxies (e.g. Nginx, Fly.io, Railway, Heroku)
app.set("trust proxy", 1);

// Security & basic middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Global Rate Limiting
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health-check", (req: Request, res: Response) => {
  return sendSuccess(res, "yorozuya_be service is healthy", {
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Root welcome endpoint
app.get("/", (req: Request, res: Response) => {
  return sendSuccess(res, "Welcome to Yorozuya Backend API (Streak Booth / Halfsies)", {
    version: "1.0.0",
    docs: "/api/v1",
  });
});

// Mount API v1 routes
app.use("/api/v1", routes);

// Handle 404 - Not Found
app.use("*", (req: Request, res: Response) => {
  return sendError(res, `Endpoint ${req.originalUrl} not found`, 404, "NOT_FOUND");
});

// Centralized error handling
app.use(errorMiddleware);

export default app;
