import { httpClient } from '../../../api/httpClient';
import type { ApiKeySummary, WebhookConfig } from '../types/gateway.types';

export const gatewayService = {
  // The secret in this response is the only time it's ever readable —
  // list() below never includes it.
  async issueApiKey(accountId: string): Promise<{ keyId: string; secret: string }> {
    const { data } = await httpClient.post(`/api/v1/merchant/accounts/${accountId}/api-keys`);
    return data.data;
  },

  async listApiKeys(accountId: string): Promise<ApiKeySummary[]> {
    const { data } = await httpClient.get(`/api/v1/merchant/accounts/${accountId}/api-keys`);
    return data.data;
  },

  async revokeApiKey(accountId: string, id: string): Promise<void> {
    await httpClient.delete(`/api/v1/merchant/accounts/${accountId}/api-keys/${id}`);
  },

  async setWebhookUrl(accountId: string, webhookUrl: string): Promise<WebhookConfig> {
    const { data } = await httpClient.put(`/api/v1/merchant/accounts/${accountId}/webhook`, { webhookUrl });
    return data.data;
  },

  async getWebhookConfig(accountId: string): Promise<WebhookConfig | null> {
    const { data } = await httpClient.get(`/api/v1/merchant/accounts/${accountId}/webhook`);
    return data.data;
  },
};
