import type { AccountSummary } from '../../account/types/account.types';

export interface TaggedEntry {
  id: string;
  accountId: string;
  transactionId: string;
  amountMinor: number;
  createdAt: string;
  category: string;
  note: string | null;
}

export interface DashboardOverview {
  accounts: AccountSummary[];
  recentTransactions: TaggedEntry[];
}

export interface CategoryTotal {
  category: string;
  totalMinor: number;
}

export interface MonthlyExpenses {
  month: string;
  totalMinor: number;
  byCategory: CategoryTotal[];
}

export interface BudgetCategory {
  category: string;
  limitMinor: number;
  spentMinor: number;
}

export interface BudgetOverview {
  month: string;
  totalLimitMinor: number;
  totalSpentMinor: number;
  categories: BudgetCategory[];
}

export interface HealthInsight {
  tone: 'good' | 'warning';
  text: string;
}

export interface FinancialHealth {
  month: string;
  score: number | null;
  label: string;
  insights: HealthInsight[];
}
