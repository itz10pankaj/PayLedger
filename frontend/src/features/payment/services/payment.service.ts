import { httpClient } from '../../../api/httpClient';
import type { CreatePaymentInput, CreatePaymentResult, RecipientPreview } from '../types/payment.types';

export const paymentService = {
  async create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // A fresh key per submit — the whole point of idempotency is that
    // *retrying the same attempt* is safe, not that every click reuses one.
    const idempotencyKey = crypto.randomUUID();
    const { data } = await httpClient.post('/api/v1/payments', input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data.data;
  },

  async resolveRecipient(phone: string): Promise<RecipientPreview> {
    const { data } = await httpClient.get('/api/v1/payments/resolve-recipient', { params: { phone } });
    return data.data;
  },

  async deposit(accountId: string, amountMinor: number): Promise<{ transactionId: string; amountMinor: number }> {
    const idempotencyKey = crypto.randomUUID();
    const { data } = await httpClient.post(
      '/api/v1/payments/deposit',
      { accountId, amountMinor },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data.data;
  },
};
