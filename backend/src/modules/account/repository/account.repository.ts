import { Account, AccountType } from '../models/account.model';

export const accountRepository = {
  async create(input: { userId: string; type: AccountType; createdBy: string }): Promise<Account> {
    return Account.create({
      userId: input.userId,
      type: input.type,
      createdBy: input.createdBy,
    });
  },

  async findById(id: string): Promise<Account | null> {
    return Account.findByPk(id);
  },

  async listByUserId(userId: string): Promise<Account[]> {
    return Account.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  },
};
