import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";
import { throwUnauthorized } from "../utils/error.util";
import { sendError } from "../utils/response.util";

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is missing", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(res, "Invalid token format", 401, "UNAUTHORIZED");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    if (!decoded || !decoded.userId) {
      return sendError(res, "Invalid or expired token", 401, "UNAUTHORIZED");
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    return sendError(res, "Authentication failed: " + (err.message || "Invalid token"), 401, "UNAUTHORIZED");
  }
};
