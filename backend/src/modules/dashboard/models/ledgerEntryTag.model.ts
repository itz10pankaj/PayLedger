import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';
import { EXPENSE_CATEGORIES } from '../categories';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `ledger_entry_tags` table to match this definition.
//
// ledger_entries is append-only and immutable by design (it's the
// financial fact). Categorizing a transaction is a personal, editable
// annotation someone might change their mind about — that can't live on
// an append-only row, so it's a separate, mutable table: one row per
// ledger entry, upserted whenever the account holder (re-)tags it.
interface LedgerEntryTagAttributes {
  id: string;
  ledgerEntryId: string;
  category: string;
  note: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type LedgerEntryTagCreationAttributes = Optional<
  LedgerEntryTagAttributes,
  'id' | 'note' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export class LedgerEntryTag
  extends Model<LedgerEntryTagAttributes, LedgerEntryTagCreationAttributes>
  implements LedgerEntryTagAttributes
{
  declare id: string;
  declare ledgerEntryId: string;
  declare category: string;
  declare note: string | null;
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LedgerEntryTag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ledgerEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // one tag per entry — re-tagging updates this row
      field: 'ledger_entry_id',
      references: { model: 'ledger_entries', key: 'id' },
    },
    category: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: { isIn: [[...EXPENSE_CATEGORIES]] },
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'LedgerEntryTag',
    tableName: 'ledger_entry_tags',
    underscored: true,
    timestamps: true,
  }
);
