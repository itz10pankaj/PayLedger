import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/db';
import { LedgerEntry } from '../../ledger/models/ledger.model';
import { UNCATEGORIZED } from '../categories';

export interface CategoryTotal {
  category: string;
  totalMinor: number;
}

export const dashboardRepository = {
  // account/ledger's own repositories are scoped to one account at a
  // time — the dashboard needs "across all of my accounts", which is
  // this module's whole reason for existing as infra other modules
  // don't already provide.
  async listRecentAcrossAccounts(accountIds: string[], limit: number): Promise<LedgerEntry[]> {
    if (accountIds.length === 0) return [];
    return LedgerEntry.findAll({
      where: { accountId: { [Op.in]: accountIds } },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
    });
  },

  async listAcrossAccounts(
    accountIds: string[],
    filters: { category?: string; monthStart?: Date; monthEnd?: Date },
    limit: number,
    offset: number
  ): Promise<LedgerEntry[]> {
    if (accountIds.length === 0) return [];

    if (!filters.category) {
      return LedgerEntry.findAll({
        where: {
          accountId: { [Op.in]: accountIds },
          ...(filters.monthStart && filters.monthEnd
            ? { createdAt: { [Op.gte]: filters.monthStart, [Op.lt]: filters.monthEnd } }
            : {}),
        },
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        limit,
        offset,
      });
    }

    // Filtering by category needs the tags table — plain Sequelize where()
    // can't express "categorized as X, or uncategorized and X === 'Uncategorized'"
    // cleanly, so this one path goes through raw SQL.
    const rows = await sequelize.query<{ id: string }>(
      `SELECT le.id FROM ledger_entries le
       LEFT JOIN ledger_entry_tags t ON t.ledger_entry_id = le.id
       WHERE le.account_id IN (:accountIds)
         AND COALESCE(t.category, :uncategorized) = :category
         ${filters.monthStart && filters.monthEnd ? 'AND le.created_at >= :monthStart AND le.created_at < :monthEnd' : ''}
       ORDER BY le.created_at DESC, le.id DESC
       LIMIT :limit OFFSET :offset`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          accountIds,
          category: filters.category,
          uncategorized: UNCATEGORIZED,
          monthStart: filters.monthStart ?? null,
          monthEnd: filters.monthEnd ?? null,
          limit,
          offset,
        },
      }
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
    const entries = await LedgerEntry.findAll({ where: { id: { [Op.in]: ids } } });
    // Preserve the SQL query's ordering — findAll's IN-clause doesn't.
    const byId = new Map(entries.map((e) => [e.id, e]));
    return ids.map((id) => byId.get(id)!).filter(Boolean);
  },

  // Expenses only — debits (amount_minor < 0), grouped by category, with
  // untagged entries bucketed as "Uncategorized" rather than dropped.
  async sumExpensesByCategory(accountIds: string[], monthStart: Date, monthEnd: Date): Promise<CategoryTotal[]> {
    if (accountIds.length === 0) return [];
    const rows = await sequelize.query<{ category: string; total: string }>(
      `SELECT COALESCE(t.category, :uncategorized) AS category, SUM(-le.amount_minor) AS total
       FROM ledger_entries le
       LEFT JOIN ledger_entry_tags t ON t.ledger_entry_id = le.id
       WHERE le.account_id IN (:accountIds)
         AND le.amount_minor < 0
         AND le.created_at >= :monthStart AND le.created_at < :monthEnd
       GROUP BY COALESCE(t.category, :uncategorized)
       ORDER BY total DESC`,
      {
        type: QueryTypes.SELECT,
        replacements: { accountIds, uncategorized: UNCATEGORIZED, monthStart, monthEnd },
      }
    );
    return rows.map((r) => ({ category: r.category, totalMinor: Number(r.total) }));
  },
};
