import { accountRepository } from '../../account/repository/account.repository';
import { dashboardRepository } from '../repository/dashboard.repository';
import { attachTags } from './attachTags';

const RECENT_LIMIT = 10;

// Deliberately no balance figures here. Real UPI apps don't show your
// balance just because you opened the app; checking it is always its own
// explicit, PIN-gated action — see account/services/checkBalance.service.ts.
// The dashboard reveals only the primary account's balance (via that
// endpoint), never every account's balance from one PIN.
export async function getOverview(userId: string) {
  const accounts = await accountRepository.listByUserId(userId);

  const accountSummaries = accounts.map((account) => ({
    id: account.id,
    type: account.type,
    status: account.status,
    isPrimary: account.isPrimary,
    nickname: account.nickname,
    createdAt: account.createdAt,
  }));

  const accountIds = accounts.map((a) => a.id);
  const recentEntries = await dashboardRepository.listRecentAcrossAccounts(accountIds, RECENT_LIMIT);
  const recentTransactions = await attachTags(recentEntries);

  return { accounts: accountSummaries, recentTransactions };
}
