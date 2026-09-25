import { MerchantApiKey } from '../models/merchantApiKey.model';

export const merchantApiKeyRepository = {
  async create(accountId: string, keyId: string, secretHash: string, actorId: string): Promise<MerchantApiKey> {
    return MerchantApiKey.create({ accountId, keyId, secretHash, createdBy: actorId });
  },

  async listByAccountId(accountId: string): Promise<MerchantApiKey[]> {
    return MerchantApiKey.findAll({ where: { accountId }, order: [['createdAt', 'DESC']] });
  },

  async findById(id: string): Promise<MerchantApiKey | null> {
    return MerchantApiKey.findByPk(id);
  },

  // The auth path for the public gateway API — one indexed exact-match
  // query, no separate "find candidate then verify" step.
  async findActiveBySecretHash(secretHash: string): Promise<MerchantApiKey | null> {
    return MerchantApiKey.findOne({ where: { secretHash, status: 'active' } });
  },

  async revoke(id: string, actorId: string): Promise<void> {
    await MerchantApiKey.update({ status: 'revoked', updatedBy: actorId }, { where: { id } });
  },
};
