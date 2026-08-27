import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as pairService from "../services/pair.service";
import { sendSuccess } from "../utils/response.util";

const joinPairSchema = z.object({
  code: z.string().min(1, "Pairing code is required").max(10),
});

export const createInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const invite = await pairService.createPairInvite(userId);
    return sendSuccess(res, "Pairing invite code generated", invite, 201);
  } catch (error) {
    next(error);
  }
};

export const joinPairController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { code } = joinPairSchema.parse(req.body);
    const result = await pairService.joinPair(userId, code);
    return sendSuccess(res, result.message, { couple_id: result.couple_id });
  } catch (error) {
    next(error);
  }
};

export const getStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const status = await pairService.getCoupleStatus(userId);
    return sendSuccess(res, "Pairing status retrieved", status);
  } catch (error) {
    next(error);
  }
};

export const disconnectController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await pairService.disconnectCouple(userId);
    return sendSuccess(res, "Successfully disconnected from partner");
  } catch (error) {
    next(error);
  }
};
