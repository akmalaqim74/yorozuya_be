import { Request, Response, NextFunction } from "express";
import * as statsService from "../services/stats.service";
import { sendSuccess } from "../utils/response.util";

export const getUsStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const stats = await statsService.getRelationshipStats(userId);
    return sendSuccess(res, "Relationship stats retrieved", stats);
  } catch (error) {
    next(error);
  }
};
