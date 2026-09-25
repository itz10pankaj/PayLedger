import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as gatewayService from './services';

export const publicGatewayController = {
  createPaymentIntent: asyncHandler(async (req: Request, res: Response) => {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      throw ApiError.badRequest('Idempotency-Key header is required');
    }

    const { payerPhone, amountMinor } = req.body;
    if (!payerPhone || !amountMinor) {
      throw ApiError.badRequest('payerPhone and amountMinor are required');
    }

    const intent = await gatewayService.createPaymentIntent({
      merchantAccountId: req.merchantAccountId!,
      payerPhone,
      amountMinor: Number(amountMinor),
      idempotencyKey,
    });

    res.status(201).json({
      data: {
        id: intent.id,
        status: intent.status,
        payerPhone: intent.payerPhone,
        amountMinor: intent.amountMinor,
        expiresAt: intent.expiresAt,
      },
    });
  }),
};
