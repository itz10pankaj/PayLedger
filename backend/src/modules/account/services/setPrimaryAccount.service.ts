import { accountRepository } from '../repository/account.repository';
import { getOwnedAccount } from './getAccount.service';

export async function setPrimaryAccount(accountId: string, userId: string) {
  const account = await getOwnedAccount(accountId, userId); // 404/403 first
  await accountRepository.setPrimary(account.id, userId);
}
