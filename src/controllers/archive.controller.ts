import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as archiveService from "../services/archive.service";
import { sendSuccess } from "../utils/response.util";

const toggleZineSchema = z.object({
  is_kept_for_zine: z.boolean(),
  note: z.string().optional(),
});

export const getMonthDrawerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;

    const drawer = await archiveService.getMonthOverview(userId, year, month);
    return sendSuccess(res, "Drawer overview retrieved", drawer);
  } catch (error) {
    next(error);
  }
};

export const getStripDetailsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const rollId = req.params.rollId;
    const details = await archiveService.getStripDetails(userId, rollId);
    return sendSuccess(res, "Strip details retrieved", details);
  } catch (error) {
    next(error);
  }
};

export const toggleZineStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const rollId = req.params.rollId;
    const validated = toggleZineSchema.parse(req.body);
    await archiveService.toggleZineStatus(userId, rollId, validated.is_kept_for_zine, validated.note);
    return sendSuccess(
      res,
      validated.is_kept_for_zine
        ? "Strip saved to zine collection!"
        : "Strip removed from zine collection"
    );
  } catch (error) {
    next(error);
  }
};
