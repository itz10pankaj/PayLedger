import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `ledger_entries` table to match this definition.
//
// amount_minor is signed: negative = debit (money out), positive = credit
// (money in). A balance is SUM(amount_minor) for an account — never
// stored anywhere.
//
// transaction_id groups every entry belonging to one transfer. A payment
// writes three entries at once (payer debit, payee credit, platform fee
// credit — see the technical design doc), so there's no single "other
// account" a single entry can point at; querying by transaction_id is how
// you find every account involved in a given transfer. FK to a
// `transactions` table gets added once the payment module creates one.
//
// No updated_by column: entries are append-only, nothing is ever updated.
interface LedgerEntryAttributes {
  id: string;
  accountId: string;
  transactionId: string;
  amountMinor: number;
  createdBy: string | null;
  createdAt: Date;
}

type LedgerEntryCreationAttributes = Optional<LedgerEntryAttributes, 'id' | 'createdBy' | 'createdAt'>;

export class LedgerEntry
  extends Model<LedgerEntryAttributes, LedgerEntryCreationAttributes>
  implements LedgerEntryAttributes
{
  declare id: string;
  declare accountId: string;
  declare transactionId: string;
  declare amountMinor: number;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
}

LedgerEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'account_id',
      references: { model: 'accounts', key: 'id' },
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'transaction_id',
    },
    amountMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'amount_minor',
      // BIGINT comes back as a string by default (avoids silent precision
      // loss past Number.MAX_SAFE_INTEGER). Paise amounts never get
      // remotely close to that, so parse it here instead of pushing
      // string-handling into every call site.
      get(): number {
        const raw = this.getDataValue('amountMinor');
        return raw === null ? (raw as unknown as number) : Number(raw);
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'LedgerEntry',
    tableName: 'ledger_entries',
    underscored: true,
    timestamps: true,
    updatedAt: false, // append-only — there is no updated_at
    indexes: [{ fields: ['account_id'] }, { fields: ['transaction_id'] }],
  }
);
