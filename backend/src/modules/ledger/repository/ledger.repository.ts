import { Transaction } from 'sequelize';
import { LedgerEntry } from '../models/ledger.model';

export const ledgerRepository = {
  // Entries are always written in bulk (a transfer is never one entry —
  // see the technical design doc's double-entry flow) and never updated
  // or deleted once written. Accepts an optional Sequelize transaction so
  // the (future) payment service can make the whole transfer atomic.
  async insertEntries(
    entries: Array<{ accountId: string; transactionId: string; amountMinor: number; createdBy?: string | null }>,
    options?: { transaction?: Transaction }
  ): Promise<LedgerEntry[]> {
    if (entries.length === 0) return [];
    return LedgerEntry.bulkCreate(
      entries.map((e) => ({
        accountId: e.accountId,
        transactionId: e.transactionId,
        amountMinor: e.amountMinor,
        createdBy: e.createdBy ?? null,
      })),
      { transaction: options?.transaction }
    );
  },

  async sumByAccountId(accountId: string): Promise<number> {
    const total = await LedgerEntry.sum('amountMinor', { where: { accountId } });
    return total ?? 0;
  },

  async listByAccountId(accountId: string, limit: number, offset: number): Promise<LedgerEntry[]> {
    return LedgerEntry.findAll({
      where: { accountId },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
    });
  },
};
