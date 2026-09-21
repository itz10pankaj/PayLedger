import { httpClient } from '../../../api/httpClient';
import type { DashboardOverview, MonthlyExpenses, TaggedEntry } from '../types/dashboard.types';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await httpClient.get('/api/v1/dashboard/overview');
    return data.data;
  },

  async getTransactions(params?: {
    accountId?: string;
    category?: string;
    month?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: TaggedEntry[]; limit: number; offset: number }> {
    const { data } = await httpClient.get('/api/v1/dashboard/transactions', { params });
    return data.data;
  },

  async getExpenses(month: string): Promise<MonthlyExpenses> {
    const { data } = await httpClient.get('/api/v1/dashboard/expenses', { params: { month } });
    return data.data;
  },

  async getCategories(): Promise<string[]> {
    const { data } = await httpClient.get('/api/v1/dashboard/categories');
    return data.data;
  },

  async tagTransaction(entryId: string, category: string, note?: string | null): Promise<void> {
    await httpClient.patch(`/api/v1/dashboard/transactions/${entryId}/category`, { category, note });
  },
};
