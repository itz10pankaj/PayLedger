import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as gatewayService from './services';

// The customer's side of a payment intent — session-authenticated, scoped
// to whatever phone number the caller is logged in as. Contrast with
// publicGateway.controller.ts (the merchant's server, API-key
// authenticated, creating the intent in the first place).
export const paymentIntentController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    const data = await gatewayService.listPendingForPhone(req.user!.phone);
    res.status(200).json({ data });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const { payerAccountId, tPin } = req.body;
    if (!payerAccountId || !tPin) {
      throw ApiError.badRequest('payerAccountId and tPin are required');
    }
    const data = await gatewayService.approvePaymentIntent(
      req.params.id,
      req.user!.userId,
      req.user!.phone,
      payerAccountId,
      tPin
    );
    res.status(200).json({ data });
  }),

  decline: asyncHandler(async (req: Request, res: Response) => {
    await gatewayService.declinePaymentIntent(req.params.id, req.user!.phone);
    res.status(204).send();
  }),
};
