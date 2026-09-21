import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as dashboardService from './services';
import { EXPENSE_CATEGORIES } from './categories';

export const dashboardController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getOverview(req.user!.userId);
    res.status(200).json({ data });
  }),

  transactions: asyncHandler(async (req: Request, res: Response) => {
    const { accountId, category, month, limit, offset } = req.query;
    const data = await dashboardService.getTransactions(req.user!.userId, {
      accountId: typeof accountId === 'string' ? accountId : undefined,
      category: typeof category === 'string' ? category : undefined,
      month: typeof month === 'string' ? month : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.status(200).json({ data });
  }),

  expenses: asyncHandler(async (req: Request, res: Response) => {
    const month = req.query.month;
    if (typeof month !== 'string') {
      throw ApiError.badRequest('month query param (YYYY-MM) is required');
    }
    const data = await dashboardService.getMonthlyExpenses(req.user!.userId, month);
    res.status(200).json({ data });
  }),

  tagTransaction: asyncHandler(async (req: Request, res: Response) => {
    const { category, note } = req.body;
    if (!category) {
      throw ApiError.badRequest('category is required');
    }
    const tag = await dashboardService.tagTransaction(req.params.entryId, req.user!.userId, { category, note });
    res.status(200).json({ data: tag });
  }),

  categories: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ data: EXPENSE_CATEGORIES });
  }),
};
