import { ApiError } from '../../../common/utils/ApiError';
import { budgetRepository } from '../repository/budget.repository';
import { EXPENSE_CATEGORIES } from '../categories';

export async function setBudget(userId: string, category: string, limitMinor: number, actorId: string) {
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) {
    throw ApiError.badRequest(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
  if (!Number.isInteger(limitMinor) || limitMinor <= 0) {
    throw ApiError.badRequest('limitMinor must be a positive integer');
  }
  return budgetRepository.upsert(userId, category, limitMinor, actorId);
}
