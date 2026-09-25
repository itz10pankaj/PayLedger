import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { merchantApiKeyRepository } from '../repository/merchantApiKey.repository';
import { hashApiSecret } from '../utils/hashApiSecret';

export interface ApiKeySummary {
  id: string;
  keyId: string;
  status: string;
  createdAt: Date;
}

// The secret is returned here and only here — it's hashed before this
// function even returns, so there is no later endpoint that could leak it
// even if someone wanted to build one.
export async function issueApiKey(accountId: string, userId: string): Promise<{ keyId: string; secret: string }> {
  const account = await getOwnedAccount(accountId, userId);
  if (account.type !== 'merchant') {
    throw ApiError.badRequest('API keys are only available for Business accounts');
  }

  const keyId = `pk_live_${crypto.randomBytes(8).toString('hex')}`;
  const secret = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const secretHash = hashApiSecret(secret);

  await merchantApiKeyRepository.create(accountId, keyId, secretHash, userId);

  return { keyId, secret };
}

// Never includes secretHash — there's no legitimate reason for it to
// leave the database once it's written.
export async function listApiKeys(accountId: string, userId: string): Promise<ApiKeySummary[]> {
  await getOwnedAccount(accountId, userId);
  const keys = await merchantApiKeyRepository.listByAccountId(accountId);
  return keys.map((k) => ({ id: k.id, keyId: k.keyId, status: k.status, createdAt: k.createdAt }));
}

export async function revokeApiKey(accountId: string, keyId: string, userId: string): Promise<void> {
  await getOwnedAccount(accountId, userId);

  const key = await merchantApiKeyRepository.findById(keyId);
  if (!key || key.accountId !== accountId) {
    throw ApiError.notFound('API key not found');
  }

  await merchantApiKeyRepository.revoke(keyId, userId);
}
