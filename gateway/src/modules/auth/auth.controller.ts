import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as authService from './services';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      throw ApiError.badRequest('phone and password are required');
    }
    const result = await authService.requestOtp({ phone, password });
    res.status(200).json({ data: result });
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      throw ApiError.badRequest('phone and otp are required');
    }
    const result = await authService.verifyOtp({ phone, otp });
    res.status(200).json({ data: result });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ data: req.user });
  }),
};
