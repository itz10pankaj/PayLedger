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
