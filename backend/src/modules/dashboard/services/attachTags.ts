import { LedgerEntry } from '../../ledger/models/ledger.model';
import { ledgerEntryTagRepository } from '../repository/ledgerEntryTag.repository';
import { UNCATEGORIZED } from '../categories';

export interface TaggedEntry {
  id: string;
  accountId: string;
  transactionId: string;
  amountMinor: number;
  createdAt: Date;
  category: string;
  note: string | null;
}

// Shared by every endpoint that returns a list of entries — merges each
// one with its tag (or "Uncategorized" if it was never tagged).
export async function attachTags(entries: LedgerEntry[]): Promise<TaggedEntry[]> {
  const tags = await ledgerEntryTagRepository.findByEntryIds(entries.map((e) => e.id));
  const tagByEntryId = new Map(tags.map((t) => [t.ledgerEntryId, t]));

  return entries.map((e) => {
    const tag = tagByEntryId.get(e.id);
    return {
      id: e.id,
      accountId: e.accountId,
      transactionId: e.transactionId,
      amountMinor: e.amountMinor,
      createdAt: e.createdAt,
      category: tag?.category ?? UNCATEGORIZED,
      note: tag?.note ?? null,
    };
  });
}
