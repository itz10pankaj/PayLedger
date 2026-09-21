import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../../account/repository/account.repository';
import { dashboardRepository } from '../repository/dashboard.repository';

export async function getMonthlyExpenses(userId: string, month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw ApiError.badRequest('month must be in YYYY-MM format');
  }

  const accounts = await accountRepository.listByUserId(userId);
  const accountIds = accounts.map((a) => a.id);

  const [year, mon] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, mon - 1, 1));
  const monthEnd = new Date(Date.UTC(year, mon, 1));

  const byCategory = await dashboardRepository.sumExpensesByCategory(accountIds, monthStart, monthEnd);
  const totalMinor = byCategory.reduce((sum, c) => sum + c.totalMinor, 0);

  return { month, totalMinor, byCategory };
}
