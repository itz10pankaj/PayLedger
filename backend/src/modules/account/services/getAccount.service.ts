import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../repository/account.repository';
import { Account } from '../models/account.model';

// Every read in this module goes through this ownership check first —
// an account holder can only ever see their own accounts.
export async function getOwnedAccount(accountId: string, requestingUserId: string): Promise<Account> {
  const account = await accountRepository.findById(accountId);
  if (!account) {
    throw ApiError.notFound('Account not found');
  }
  if (account.userId !== requestingUserId) {
    throw ApiError.forbidden('This account does not belong to you');
  }
  return account;
}

export async function listMyAccounts(userId: string): Promise<Account[]> {
  return accountRepository.listByUserId(userId);
}
