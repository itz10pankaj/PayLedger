import { accountRepository } from '../../account/repository/account.repository';
import { dashboardRepository } from '../repository/dashboard.repository';
import { attachTags } from './attachTags';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface GetTransactionsFilters {
  accountId?: string;
  category?: string;
  month?: string; // 'YYYY-MM' — ignored if from/to is given
  from?: string; // 'YYYY-MM-DD', inclusive
  to?: string; // 'YYYY-MM-DD', inclusive
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

// An explicit from/to date range takes over from the month picker rather
// than combining with it — asking for "March" AND "after the 10th" is a
// UI a user would have to reconcile, not a filter worth supporting.
function resolveDateRange(filters: GetTransactionsFilters): { monthStart?: Date; monthEnd?: Date } {
  if (filters.from || filters.to) {
    const monthStart = filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : undefined;
    // "to" is inclusive of that whole day, so the exclusive upper bound is the day after.
    const monthEnd = filters.to ? new Date(new Date(`${filters.to}T00:00:00.000Z`).getTime() + 86400000) : undefined;
    return { monthStart, monthEnd };
  }
  return monthRange(filters.month);
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
  const { monthStart, monthEnd } = resolveDateRange(filters);

  const entries = await dashboardRepository.listAcrossAccounts(
    accountIds,
    { category: filters.category, monthStart, monthEnd },
    limit,
    offset
  );
  const transactions = await attachTags(entries);

  return { transactions, limit, offset };
}
