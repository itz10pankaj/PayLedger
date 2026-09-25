import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { merchantWebhookConfigRepository } from '../repository/merchantWebhookConfig.repository';

// The signing secret is generated once, the first time a merchant sets a
// webhook URL, and then kept stable on every later URL change — swapping
// where notifications go shouldn't silently break a signature the
// merchant already has wired up on their end.
export async function setWebhookUrl(
  accountId: string,
  userId: string,
  webhookUrl: string
): Promise<{ webhookUrl: string; webhookSecret: string }> {
  const account = await getOwnedAccount(accountId, userId);
  if (account.type !== 'merchant') {
    throw ApiError.badRequest('Webhooks are only available for Business accounts');
  }

  let parsed: URL;
  try {
    parsed = new URL(webhookUrl);
  } catch {
    throw ApiError.badRequest('webhookUrl must be a valid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw ApiError.badRequest('webhookUrl must use http or https');
  }

  const existing = await merchantWebhookConfigRepository.findByAccountId(accountId);
  const webhookSecret = existing?.webhookSecret ?? `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const config = await merchantWebhookConfigRepository.upsert(accountId, webhookUrl, webhookSecret, userId);
  return { webhookUrl: config.webhookUrl, webhookSecret: config.webhookSecret };
}

export async function getWebhookConfig(
  accountId: string,
  userId: string
): Promise<{ webhookUrl: string; webhookSecret: string } | null> {
  await getOwnedAccount(accountId, userId);
  const config = await merchantWebhookConfigRepository.findByAccountId(accountId);
  return config ? { webhookUrl: config.webhookUrl, webhookSecret: config.webhookSecret } : null;
}
