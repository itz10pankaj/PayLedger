import { budgetRepository } from '../repository/budget.repository';

export async function removeBudget(userId: string, category: string) {
  await budgetRepository.remove(userId, category);
}
