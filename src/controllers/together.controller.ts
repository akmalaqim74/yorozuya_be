import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as togetherService from "../services/together.service";
import { sendSuccess } from "../utils/response.util";
import { throwBadRequest } from "../utils/error.util";

const inviteSchema = z.object({
  slot_index: z.number().int().min(0).max(3),
});

const respondSchema = z.object({
  accept: z.boolean(),
});

export const sendInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validated = inviteSchema.parse(req.body);
    const invite = await togetherService.sendInvite(userId, validated.slot_index);
    return sendSuccess(res, "Together invite sent", invite, 201);
  } catch (error) {
    next(error);
  }
};

export const respondInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validated = respondSchema.parse(req.body);
    await togetherService.respondInvite(userId, validated.accept);
    return sendSuccess(res, validated.accept ? "Invite accepted" : "Invite declined");
  } catch (error) {
    next(error);
  }
};

export const cancelInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await togetherService.cancelInvite(userId);
    return sendSuccess(res, "Invite cancelled");
  } catch (error) {
    next(error);
  }
};

export const shootTogetherController = async (req: Request, res: Response, next: NextFunction) => {
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

    const result = await togetherService.shootTogether(userId, slotIndex, photoFile);
    return sendSuccess(res, "Photo captured and developed for both of you!", result, 201);
  } catch (error) {
    next(error);
  }
};
