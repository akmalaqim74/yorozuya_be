import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as boothService from "../services/booth.service";
import { sendSuccess } from "../utils/response.util";
import { throwBadRequest } from "../utils/error.util";

const updateThemeSchema = z.object({
  look: z.string().optional(),
  paper: z.string().optional(),
  sticker_set: z.string().optional(),
});

export const getTodayStateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const state = await boothService.getTodayState(userId);
    return sendSuccess(res, "Today's booth state retrieved", state);
  } catch (error) {
    next(error);
  }
};

export const updateThemeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validated = updateThemeSchema.parse(req.body);
    const updatedState = await boothService.updateRollTheme(userId, validated);
    return sendSuccess(res, "Roll theme updated successfully", updatedState);
  } catch (error) {
    next(error);
  }
};

export const shootExposureController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const slotIndex = parseInt(req.params.slotIndex, 10);
    if (isNaN(slotIndex)) {
      throwBadRequest("Invalid slot index parameter");
    }

    const photoFile = req.file;
    if (!photoFile) {
      throwBadRequest("Photo file is required (form-data field: 'photo')");
    }

    const result = await boothService.shootExposure(userId, slotIndex, photoFile);
    return sendSuccess(res, "Photo captured and developed!", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getDispensedStripController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const rollId = req.query.roll_id as string | undefined;
    const strip = await boothService.getDispensedStrip(userId, rollId);
    return sendSuccess(res, "Photobooth strip retrieved", strip);
  } catch (error) {
    next(error);
  }
};
