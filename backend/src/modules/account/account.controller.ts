import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as accountService from './services';

const VALID_TYPES = ['payer', 'payee', 'merchant'];

export const accountController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.body;
    if (!VALID_TYPES.includes(type)) {
      throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    const account = await accountService.createAccount({ userId: req.user!.userId, type });
    res.status(201).json({ data: account });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const accounts = await accountService.listMyAccounts(req.user!.userId);
    res.status(200).json({ data: accounts });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const account = await accountService.getOwnedAccount(req.params.id, req.user!.userId);
    res.status(200).json({ data: account });
  }),

  getBalance: asyncHandler(async (req: Request, res: Response) => {
    const balance = await accountService.getBalance(req.params.id, req.user!.userId);
    res.status(200).json({ data: balance });
  }),

  getLedger: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const page = await accountService.getLedgerPage(req.params.id, req.user!.userId, { limit, offset });
    res.status(200).json({ data: page });
  }),
};
