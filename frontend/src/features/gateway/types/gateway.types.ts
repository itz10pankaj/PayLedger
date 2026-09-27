export interface ApiKeySummary {
  id: string;
  keyId: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface WebhookConfig {
  webhookUrl: string;
  webhookSecret: string;
}

export interface PendingPaymentIntent {
  id: string;
  amountMinor: number;
  merchantName: string;
  expiresAt: string;
  createdAt: string;
}

export interface ApprovePaymentIntentResult {
  id: string;
  status: 'approved';
  transactionId: string;
}

export interface CreatedPaymentIntent {
  id: string;
  status: 'pending';
  payerPhone: string;
  amountMinor: number;
  expiresAt: string;
}

export type PaymentIntentStatus = 'pending' | 'approved' | 'declined' | 'expired';

export interface PaymentIntentHistoryItem {
  id: string;
  amountMinor: number;
  merchantName: string;
  status: 'approved' | 'declined' | 'expired';
  transactionId: string | null;
  createdAt: string;
}

export interface SentPaymentIntentItem {
  id: string;
  payerPhone: string;
  amountMinor: number;
  status: PaymentIntentStatus;
  transactionId: string | null;
  accountName: string;
  createdAt: string;
}
