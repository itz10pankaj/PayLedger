import type { Optional } from 'sequelize';

export type MerchantApiKeyStatus = 'active' | 'revoked';
export type PaymentIntentStatus = 'pending' | 'approved' | 'declined' | 'expired';
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'dead';

export interface MerchantApiKeyAttributes {
  id: string;
  accountId: string;
  keyId: string;
  secretHash: string;
  status: MerchantApiKeyStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MerchantApiKeyCreationAttributes = Optional<
  MerchantApiKeyAttributes,
  'id' | 'status' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

// One row per merchant account, not per key — a webhook destination
// belongs to the merchant, not to whichever credential is currently
// active. No row at all means "not configured yet"; there's no nullable
// half-configured state to worry about.
export interface MerchantWebhookConfigAttributes {
  accountId: string;
  webhookUrl: string;
  webhookSecret: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MerchantWebhookConfigCreationAttributes = Optional<
  MerchantWebhookConfigAttributes,
  'updatedBy' | 'createdAt' | 'updatedAt'
>;

export interface PaymentIntentAttributes {
  id: string;
  merchantAccountId: string;
  payerPhone: string;
  amountMinor: number;
  status: PaymentIntentStatus;
  transactionId: string | null;
  idempotencyKey: string;
  expiresAt: Date;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentIntentCreationAttributes = Optional<
  PaymentIntentAttributes,
  'id' | 'status' | 'transactionId' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export interface WebhookDeliveryAttributes {
  id: string;
  paymentIntentId: string;
  url: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastAttemptAt: Date | null;
  responseStatus: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookDeliveryCreationAttributes = Optional<
  WebhookDeliveryAttributes,
  'id' | 'status' | 'attempts' | 'lastAttemptAt' | 'responseStatus' | 'createdAt' | 'updatedAt'
>;
