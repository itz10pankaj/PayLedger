import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as paymentService from './services';
import { previewRecipient } from './services/resolveRecipient.service';

export const paymentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      throw ApiError.badRequest('Idempotency-Key header is required');
    }

    const { payerAccountId, toPhone, amountMinor, tPin } = req.body;
    if (!payerAccountId || !toPhone || !amountMinor || !tPin) {
      throw ApiError.badRequest('payerAccountId, toPhone, amountMinor and tPin are required');
    }

    const result = await paymentService.createPayment({
      requestingUserId: req.user!.userId,
      payerAccountId,
      toPhone,
      amountMinor: Number(amountMinor),
      idempotencyKey,
      tPin,
    });

    res.status(result.statusCode).json({ data: result.body });
  }),

  deposit: asyncHandler(async (req: Request, res: Response) => {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      throw ApiError.badRequest('Idempotency-Key header is required');
    }

    const { accountId, amountMinor } = req.body;
    if (!accountId || !amountMinor) {
      throw ApiError.badRequest('accountId and amountMinor are required');
    }

    const result = await paymentService.createDeposit({
      requestingUserId: req.user!.userId,
      accountId,
      amountMinor: Number(amountMinor),
      idempotencyKey,
    });

    res.status(result.statusCode).json({ data: result.body });
  }),

  // Lets the sender confirm who they're paying before they hit send.
  resolveRecipient: asyncHandler(async (req: Request, res: Response) => {
    const phone = req.query.phone;
    if (typeof phone !== 'string') {
      throw ApiError.badRequest('phone query param is required');
    }
    const recipient = await previewRecipient(phone);
    res.status(200).json({ data: recipient });
  }),
};
