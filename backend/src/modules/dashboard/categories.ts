// Fixed preset list — single source of truth for both the DB-level
// validation and whatever the frontend shows in the tag picker (served
// via GET /dashboard/categories so the two can never drift apart).
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Bills & Utilities',
  'Rent',
  'Transport',
  'Entertainment',
  'Health',
  'Transfer',
  'Income',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const UNCATEGORIZED = 'Uncategorized';
