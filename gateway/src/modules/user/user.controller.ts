import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as userService from './services';

export const userController = {
  signupStart: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      throw ApiError.badRequest('name, email, phone and password are required');
    }
    const result = await userService.startSignup({ name, email, phone, password, role: role ?? 'payer' });
    res.status(200).json({ data: result });
  }),

  signupVerify: asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      throw ApiError.badRequest('phone and otp are required');
    }
    const user = await userService.verifySignup(phone, otp);
    res.status(201).json({ data: user });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ data: user });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;
    const user = await userService.updateUser(req.params.id, { name, email }, req.user!.userId);
    res.status(200).json({ data: user });
  }),
};
