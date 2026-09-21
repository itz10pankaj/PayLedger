import type { AccountWithBalance } from '../../account/types/account.types';

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
  accounts: AccountWithBalance[];
  totalBalanceMinor: number;
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
