import { accountRepository } from '../../account/repository/account.repository';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { dashboardRepository } from '../repository/dashboard.repository';
import { attachTags } from './attachTags';

const RECENT_LIMIT = 10;

export async function getOverview(userId: string) {
  const accounts = await accountRepository.listByUserId(userId);

  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => ({
      id: account.id,
      type: account.type,
      status: account.status,
      createdAt: account.createdAt,
      balanceMinor: await ledgerRepository.sumByAccountId(account.id),
    }))
  );

  const totalBalanceMinor = accountsWithBalance.reduce((sum, a) => sum + a.balanceMinor, 0);

  const accountIds = accounts.map((a) => a.id);
  const recentEntries = await dashboardRepository.listRecentAcrossAccounts(accountIds, RECENT_LIMIT);
  const recentTransactions = await attachTags(recentEntries);

  return { accounts: accountsWithBalance, totalBalanceMinor, recentTransactions };
}
