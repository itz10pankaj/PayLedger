import { LedgerEntryTag } from '../models/ledgerEntryTag.model';

export const ledgerEntryTagRepository = {
  async upsert(input: {
    ledgerEntryId: string;
    category: string;
    note: string | null;
    userId: string;
  }): Promise<LedgerEntryTag> {
    const existing = await LedgerEntryTag.findOne({ where: { ledgerEntryId: input.ledgerEntryId } });
    if (existing) {
      existing.category = input.category;
      existing.note = input.note;
      existing.updatedBy = input.userId;
      await existing.save();
      return existing;
    }
    return LedgerEntryTag.create({
      ledgerEntryId: input.ledgerEntryId,
      category: input.category,
      note: input.note,
      createdBy: input.userId,
    });
  },

  async findByEntryIds(ledgerEntryIds: string[]): Promise<LedgerEntryTag[]> {
    if (ledgerEntryIds.length === 0) return [];
    return LedgerEntryTag.findAll({ where: { ledgerEntryId: ledgerEntryIds } });
  },
};
