import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/error.util";
import { sendError } from "../utils/response.util";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("⚠️ Error Handler:", err);

  // AppError instance
  if (err instanceof AppError) {
    return sendError(res, err.message, err.status, err.code);
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return sendError(res, `Validation error: ${message}`, 422, "VALIDATION_ERROR");
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    return sendError(res, `File upload error: ${err.message}`, 400, "UPLOAD_ERROR");
  }

  // Fallback 500 error
  return sendError(res, err.message || "Internal server error", 500, "INTERNAL_SERVER_ERROR");
};
