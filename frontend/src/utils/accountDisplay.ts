import type { AccountType } from '../features/account/types/account.types';

// So two accounts of the same type are distinguishable — a nickname if
// the user set one, otherwise a masked id suffix (same idea as a card's
// last 4 digits) rather than just a bare, indistinguishable "Personal".
export function accountDisplayName(account: { id: string; type: AccountType; nickname: string | null }): string {
  if (account.nickname) return account.nickname;
  const label = account.type === 'merchant' ? 'Business' : 'Personal';
  return `${label} •••• ${account.id.slice(-4)}`;
}
