// 'payee' still exists on old accounts created before this simplification,
// but the "Add account" flow only ever offers 'payer' (Personal) or
// 'merchant' (Business) now — the two don't behave differently anywhere
// except that a merchant account has the MDR fee applied on money it
// receives, so a 3-way split just added end-user-facing confusion.
export type AccountType = 'payer' | 'payee' | 'merchant';
export type AccountStatus = 'active' | 'frozen' | 'closed';

export interface Account {
  id: string;
  userId: string;
  type: AccountType;
  status: AccountStatus;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountWithBalance {
  id: string;
  type: AccountType;
  status: AccountStatus;
  createdAt: string;
  balanceMinor: number;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  amountMinor: number;
  createdAt: string;
}
