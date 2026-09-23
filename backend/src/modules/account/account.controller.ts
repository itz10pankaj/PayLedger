import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as accountService from './services';
import { toSafeAccount } from './repository/account.repository';

export const accountController = {
  startCreate: asyncHandler(async (req: Request, res: Response) => {
    const { type, nickname } = req.body;
    if (!type) {
      throw ApiError.badRequest('type is required');
    }
    const result = await accountService.startAccountCreation(req.user!.userId, req.user!.phone, type, nickname);
    res.status(200).json({ data: result });
  }),

  verifyCreate: asyncHandler(async (req: Request, res: Response) => {
    const { otp, tPin } = req.body;
    if (!otp || !tPin) {
      throw ApiError.badRequest('otp and tPin are required');
    }
    const account = await accountService.verifyAccountCreation(req.user!.userId, otp, tPin);
    res.status(201).json({ data: account });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const accounts = await accountService.listMyAccounts(req.user!.userId);
    res.status(200).json({ data: accounts.map(toSafeAccount) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const account = await accountService.getOwnedAccount(req.params.id, req.user!.userId);
    res.status(200).json({ data: toSafeAccount(account) });
  }),

  // The only place a balance figure leaves the server — requires the
  // account's own T-PIN, same as a real UPI app's "Check Balance".
  checkBalance: asyncHandler(async (req: Request, res: Response) => {
    const { tPin } = req.body;
    if (!tPin) {
      throw ApiError.badRequest('tPin is required');
    }
    const balance = await accountService.checkBalance(req.params.id, req.user!.userId, tPin);
    res.status(200).json({ data: balance });
  }),

  getLedger: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const page = await accountService.getLedgerPage(req.params.id, req.user!.userId, { limit, offset });
    res.status(200).json({ data: page });
  }),

  setPrimary: asyncHandler(async (req: Request, res: Response) => {
    await accountService.setPrimaryAccount(req.params.id, req.user!.userId);
    res.status(200).json({ data: { id: req.params.id, isPrimary: true } });
  }),

  setPin: asyncHandler(async (req: Request, res: Response) => {
    const { newTPin, currentTPin } = req.body;
    if (!newTPin) {
      throw ApiError.badRequest('newTPin is required');
    }
    await accountService.setTPin(req.params.id, req.user!.userId, { newTPin, currentTPin });
    res.status(200).json({ data: { message: 'T-PIN updated' } });
  }),

  setNickname: asyncHandler(async (req: Request, res: Response) => {
    const { nickname } = req.body;
    await accountService.setNickname(req.params.id, req.user!.userId, nickname ?? null);
    res.status(200).json({ data: { message: 'Nickname updated' } });
  }),
};
