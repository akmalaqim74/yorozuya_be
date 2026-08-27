import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/response.util";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().min(1, "Display name is required"),
  timezone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  avatar_url: z.string().url().optional(),
  timezone: z.string().optional(),
});

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated);
    return sendSuccess(res, "Account created successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated);
    return sendSuccess(res, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const profile = await authService.getMe(userId);
    return sendSuccess(res, "Profile retrieved", profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validated = updateProfileSchema.parse(req.body);
    const updated = await authService.updateProfile(userId, validated);
    return sendSuccess(res, "Profile updated successfully", updated);
  } catch (error) {
    next(error);
  }
};
