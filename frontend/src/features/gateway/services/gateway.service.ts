import { httpClient } from '../../../api/httpClient';
import type {
  ApiKeySummary,
  ApprovePaymentIntentResult,
  CreatedPaymentIntent,
  PaymentIntentHistoryItem,
  PendingPaymentIntent,
  SentPaymentIntentItem,
  WebhookConfig,
} from '../types/gateway.types';

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

  // The manual "create one from the dashboard" door — same underlying
  // service as a merchant's own server hitting the API-key-authenticated
  // endpoint, just session-authenticated instead. Mainly for testing your
  // own integration without needing a second server running.
  async createPaymentRequest(accountId: string, payerPhone: string, amountMinor: number): Promise<CreatedPaymentIntent> {
    const { data } = await httpClient.post(`/api/v1/merchant/accounts/${accountId}/payment-intents`, {
      payerPhone,
      amountMinor,
    });
    return data.data;
  },

  // The customer's side — requests addressed to whatever phone number
  // the caller is logged in as, not scoped to any one account.
  async listPendingPaymentRequests(): Promise<PendingPaymentIntent[]> {
    const { data } = await httpClient.get('/api/v1/payment-intents/pending');
    return data.data;
  },

  async approvePaymentRequest(intentId: string, payerAccountId: string, tPin: string): Promise<ApprovePaymentIntentResult> {
    const { data } = await httpClient.post(`/api/v1/payment-intents/${intentId}/approve`, { payerAccountId, tPin });
    return data.data;
  },

  async declinePaymentRequest(intentId: string): Promise<void> {
    await httpClient.post(`/api/v1/payment-intents/${intentId}/decline`);
  },

  // "What did I approve or reject" — everything that's left the pending
  // state, most recently resolved first.
  async listPaymentRequestHistory(): Promise<PaymentIntentHistoryItem[]> {
    const { data } = await httpClient.get('/api/v1/payment-intents/history');
    return data.data;
  },

  // "What have I requested" — across every Business account this user
  // owns, not scoped to one. Pairs with listPendingPaymentRequests /
  // listPaymentRequestHistory as the "Sent" tab next to "Received".
  async listSentPaymentRequests(): Promise<SentPaymentIntentItem[]> {
    const { data } = await httpClient.get('/api/v1/payment-intents/sent');
    return data.data;
  },
};
