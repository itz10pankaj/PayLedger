import { accountRepository } from '../../account/repository/account.repository';
import { dashboardRepository } from '../repository/dashboard.repository';
import { attachTags } from './attachTags';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface GetTransactionsFilters {
  accountId?: string;
  category?: string;
  month?: string; // 'YYYY-MM'
  limit?: number;
  offset?: number;
}

function monthRange(month?: string): { monthStart?: Date; monthEnd?: Date } {
  if (!month) return {};
  const [year, mon] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, mon - 1, 1));
  const monthEnd = new Date(Date.UTC(year, mon, 1));
  return { monthStart, monthEnd };
}

export async function getTransactions(userId: string, filters: GetTransactionsFilters) {
  const accounts = await accountRepository.listByUserId(userId);
  const ownedAccountIds = accounts.map((a) => a.id);
  // Scoping to one account only makes sense if the caller actually owns
  // it — silently ignoring an accountId that isn't theirs (rather than
  // erroring) just means they see nothing, not someone else's data.
  const accountIds =
    filters.accountId && ownedAccountIds.includes(filters.accountId) ? [filters.accountId] : ownedAccountIds;

  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = filters.offset ?? 0;
  const { monthStart, monthEnd } = monthRange(filters.month);

  const entries = await dashboardRepository.listAcrossAccounts(
    accountIds,
    { category: filters.category, monthStart, monthEnd },
    limit,
    offset
  );
  const transactions = await attachTags(entries);

  return { transactions, limit, offset };
}
