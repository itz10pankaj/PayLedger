import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiError } from '../../common/utils/ApiError';
import * as gatewayService from './services';

export const gatewayController = {
  issueApiKey: asyncHandler(async (req: Request, res: Response) => {
    const result = await gatewayService.issueApiKey(req.params.accountId, req.user!.userId);
    res.status(201).json({ data: result });
  }),

  listApiKeys: asyncHandler(async (req: Request, res: Response) => {
    const data = await gatewayService.listApiKeys(req.params.accountId, req.user!.userId);
    res.status(200).json({ data });
  }),

  revokeApiKey: asyncHandler(async (req: Request, res: Response) => {
    await gatewayService.revokeApiKey(req.params.accountId, req.params.id, req.user!.userId);
    res.status(204).send();
  }),

  setWebhook: asyncHandler(async (req: Request, res: Response) => {
    const { webhookUrl } = req.body;
    if (!webhookUrl) {
      throw ApiError.badRequest('webhookUrl is required');
    }
    const data = await gatewayService.setWebhookUrl(req.params.accountId, req.user!.userId, webhookUrl);
    res.status(200).json({ data });
  }),

  getWebhook: asyncHandler(async (req: Request, res: Response) => {
    const data = await gatewayService.getWebhookConfig(req.params.accountId, req.user!.userId);
    res.status(200).json({ data });
  }),

  createPaymentIntent: asyncHandler(async (req: Request, res: Response) => {
    const { payerPhone, amountMinor } = req.body;
    if (!payerPhone || !amountMinor) {
      throw ApiError.badRequest('payerPhone and amountMinor are required');
    }
    const intent = await gatewayService.createPaymentIntentAsOwner(
      req.params.accountId,
      req.user!.userId,
      payerPhone,
      Number(amountMinor)
    );
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
