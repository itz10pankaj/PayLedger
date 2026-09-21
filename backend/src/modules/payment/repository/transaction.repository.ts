import { Transaction as SequelizeTransaction } from 'sequelize';
import { Transaction } from '../models/transaction.model';

export const transactionRepository = {
  async findByIdempotencyKey(requestingUserId: string, idempotencyKey: string): Promise<Transaction | null> {
    return Transaction.findOne({ where: { requestingUserId, idempotencyKey } });
  },

  async create(
    input: {
      idempotencyKey: string;
      requestingUserId: string;
      payerAccountId: string;
      payeeAccountId: string;
      amountMinor: number;
      feeMinor: number;
      createdBy: string;
    },
    options?: { transaction?: SequelizeTransaction }
  ): Promise<Transaction> {
    return Transaction.create({ ...input, status: 'completed' }, { transaction: options?.transaction });
  },
};
