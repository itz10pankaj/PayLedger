import { accountRepository } from '../repository/account.repository';
import { Account, AccountType } from '../models/account.model';

export interface CreateAccountInput {
  userId: string;
  type: AccountType;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  // The authenticated user is always who creates their own account today.
  return accountRepository.create({ userId: input.userId, type: input.type, createdBy: input.userId });
}
