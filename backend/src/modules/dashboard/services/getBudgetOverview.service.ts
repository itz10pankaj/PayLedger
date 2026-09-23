import { ApiError } from '../../../common/utils/ApiError';
import { budgetRepository } from '../repository/budget.repository';
import { getMonthlyExpenses } from './getMonthlyExpenses.service';

// "Monthly budget" is scoped to whatever categories the user has set a
// limit for — a category with spend but no budget just doesn't show up
// here (that's what "no budget set" means), same as the mockup this was
// built from only totals the categories it lists.
export async function getBudgetOverview(userId: string, month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw ApiError.badRequest('month must be in YYYY-MM format');
  }

  const [budgets, expenses] = await Promise.all([budgetRepository.listByUserId(userId), getMonthlyExpenses(userId, month)]);
  const spentByCategory = new Map(expenses.byCategory.map((c) => [c.category, c.totalMinor]));

  const categories = budgets
    .map((b) => ({
      category: b.category,
      limitMinor: b.limitMinor,
      spentMinor: spentByCategory.get(b.category) ?? 0,
    }))
    .sort((a, b) => b.spentMinor / b.limitMinor - a.spentMinor / a.limitMinor);

  const totalLimitMinor = categories.reduce((sum, c) => sum + c.limitMinor, 0);
  const totalSpentMinor = categories.reduce((sum, c) => sum + c.spentMinor, 0);

  return { month, totalLimitMinor, totalSpentMinor, categories };
}
