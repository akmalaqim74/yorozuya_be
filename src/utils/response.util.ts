import { Response } from "express";
import { ApiResponse } from "../types/api.types";

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  const payload: ApiResponse<T> = {
    status: true,
    message,
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res: Response, message: string, statusCode = 400, code?: string) => {
  const payload: ApiResponse = {
    status: false,
    message,
    ...(code ? { code } : {}),
  };
  return res.status(statusCode).json(payload);
};
