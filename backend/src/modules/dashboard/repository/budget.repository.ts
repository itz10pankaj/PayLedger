import { Budget } from '../models/budget.model';

export const budgetRepository = {
  async listByUserId(userId: string): Promise<Budget[]> {
    return Budget.findAll({ where: { userId } });
  },

  async upsert(userId: string, category: string, limitMinor: number, actorId: string): Promise<Budget> {
    const existing = await Budget.findOne({ where: { userId, category } });
    if (existing) {
      existing.limitMinor = limitMinor;
      existing.updatedBy = actorId;
      await existing.save();
      return existing;
    }
    return Budget.create({ userId, category, limitMinor, createdBy: actorId });
  },

  async remove(userId: string, category: string): Promise<void> {
    await Budget.destroy({ where: { userId, category } });
  },
};
