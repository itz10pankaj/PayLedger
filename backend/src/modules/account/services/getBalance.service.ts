import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { getOwnedAccount } from './getAccount.service';

export async function getBalance(accountId: string, requestingUserId: string): Promise<{ balanceMinor: number }> {
  await getOwnedAccount(accountId, requestingUserId); // 404/403 before touching the ledger
  const balanceMinor = await ledgerRepository.sumByAccountId(accountId);
  return { balanceMinor };
}
