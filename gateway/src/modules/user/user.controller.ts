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

  // No :id param anywhere here — always the caller's own record. An
  // earlier version took an arbitrary :id with only `authenticate`
  // guarding it, which let any logged-in user view or edit *anyone's*
  // profile just by knowing their user id. There was no legitimate use
  // for that (nothing in this app looks up another user's profile), so
  // the fix is to remove the capability rather than add an ownership check.
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.user!.userId);
    res.status(200).json({ data: user });
  }),

  // Internal — called by backend to resolve a payment recipient's phone
  // number to a user, not exposed for general client use.
  getByPhone: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserByPhone(req.params.phone);
    res.status(200).json({ data: user });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;
    const user = await userService.updateUser(req.user!.userId, { name, email }, req.user!.userId);
    res.status(200).json({ data: user });
  }),
};
