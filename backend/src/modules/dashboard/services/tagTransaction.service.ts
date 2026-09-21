import { ApiError } from '../../../common/utils/ApiError';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { ledgerEntryTagRepository } from '../repository/ledgerEntryTag.repository';
import { EXPENSE_CATEGORIES } from '../categories';

export async function tagTransaction(
  ledgerEntryId: string,
  userId: string,
  input: { category: string; note?: string | null }
) {
  if (!EXPENSE_CATEGORIES.includes(input.category as (typeof EXPENSE_CATEGORIES)[number])) {
    throw ApiError.badRequest(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }

  const entry = await ledgerRepository.findById(ledgerEntryId);
  if (!entry) {
    throw ApiError.notFound('Transaction entry not found');
  }
  await getOwnedAccount(entry.accountId, userId); // 403 if this entry isn't on one of the caller's accounts

  return ledgerEntryTagRepository.upsert({
    ledgerEntryId,
    category: input.category,
    note: input.note ?? null,
    userId,
  });
}
