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
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
}

// No balanceMinor here on purpose — a balance is never sent to the client
// until checkBalance() succeeds with that account's T-PIN.
export interface AccountSummary {
  id: string;
  type: AccountType;
  status: AccountStatus;
  isPrimary: boolean;
  nickname: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  amountMinor: number;
  createdAt: string;
}
