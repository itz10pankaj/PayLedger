import { sequelize } from '../../../config/db';
import { Account, AccountType } from '../models/account.model';

// Not tied to any real gateway user — just a fixed owner for the one
// platform account MDR fees get credited to. See findOrCreatePlatformAccount.
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

// Never send a tPinHash back over the wire.
export function toSafeAccount(account: Account) {
  const { tPinHash, ...safe } = account.toJSON();
  return safe;
}

export const accountRepository = {
  async create(input: {
    userId: string;
    type: AccountType;
    tPinHash: string;
    isPrimary: boolean;
    nickname: string | null;
    createdBy: string | null;
  }): Promise<Account> {
    return Account.create({
      userId: input.userId,
      type: input.type,
      tPinHash: input.tPinHash,
      isPrimary: input.isPrimary,
      nickname: input.nickname,
      createdBy: input.createdBy,
    });
  },

  async findById(id: string): Promise<Account | null> {
    return Account.findByPk(id);
  },

  async listByUserId(userId: string): Promise<Account[]> {
    return Account.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  },

  async hasAnyAccount(userId: string): Promise<boolean> {
    const count = await Account.count({ where: { userId } });
    return count > 0;
  },

  // A payer doesn't pick which of the recipient's accounts to pay into —
  // this picks their primary one, falling back to their oldest active
  // account if (somehow) none is marked primary yet.
  async findPrimaryOrFirstActiveByUserId(userId: string): Promise<Account | null> {
    const primary = await Account.findOne({ where: { userId, status: 'active', isPrimary: true } });
    if (primary) return primary;
    return Account.findOne({ where: { userId, status: 'active' }, order: [['createdAt', 'ASC']] });
  },

  // Exactly one primary per user — unset any existing one first, in the
  // same DB transaction, so there's never a moment with zero or two.
  async setPrimary(accountId: string, userId: string): Promise<void> {
    await sequelize.transaction(async (t) => {
      await Account.update({ isPrimary: false }, { where: { userId, isPrimary: true }, transaction: t });
      await Account.update({ isPrimary: true }, { where: { id: accountId, userId }, transaction: t });
    });
  },

  async setTPinHash(accountId: string, tPinHash: string, updatedBy: string): Promise<void> {
    await Account.update({ tPinHash, updatedBy }, { where: { id: accountId } });
  },

  async setNickname(accountId: string, nickname: string | null, updatedBy: string): Promise<void> {
    await Account.update({ nickname, updatedBy }, { where: { id: accountId } });
  },

  // Singleton — every MDR fee is credited to this one account.
  async findOrCreatePlatformAccount(): Promise<Account> {
    const [account] = await Account.findOrCreate({
      where: { type: 'platform' },
      defaults: { userId: SYSTEM_USER_ID, type: 'platform', createdBy: null },
    });
    return account;
  },
};
