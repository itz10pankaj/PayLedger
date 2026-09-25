import { MerchantWebhookConfig } from '../models/merchantWebhookConfig.model';

export const merchantWebhookConfigRepository = {
  async findByAccountId(accountId: string): Promise<MerchantWebhookConfig | null> {
    return MerchantWebhookConfig.findByPk(accountId);
  },

  async upsert(accountId: string, webhookUrl: string, webhookSecret: string, actorId: string): Promise<MerchantWebhookConfig> {
    const existing = await MerchantWebhookConfig.findByPk(accountId);
    if (existing) {
      existing.webhookUrl = webhookUrl;
      existing.updatedBy = actorId;
      await existing.save();
      return existing;
    }
    return MerchantWebhookConfig.create({ accountId, webhookUrl, webhookSecret, updatedBy: actorId });
  },
};
