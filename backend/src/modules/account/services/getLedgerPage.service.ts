import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { LedgerEntry } from '../../ledger/models/ledger.model';
import { getOwnedAccount } from './getAccount.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getLedgerPage(
  accountId: string,
  requestingUserId: string,
  page: { limit?: number; offset?: number }
): Promise<{ entries: LedgerEntry[]; limit: number; offset: number }> {
  await getOwnedAccount(accountId, requestingUserId);

  const limit = Math.min(page.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = page.offset ?? 0;
  const entries = await ledgerRepository.listByAccountId(accountId, limit, offset);

  return { entries, limit, offset };
}
