import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';

// 'platform' is never created through the public API (see account.controller.ts) —
// it's a single internal account the payment module credits MDR fees to.
export type AccountType = 'payer' | 'payee' | 'merchant' | 'platform';
export type AccountStatus = 'active' | 'frozen' | 'closed';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `accounts` table to match this definition. No
// balance column: a balance is always SUM(ledger_entries.amount_minor).
interface AccountAttributes {
  id: string;
  userId: string;
  type: AccountType;
  status: AccountStatus;
  // Per-account transaction PIN (like a real bank-linked UPI PIN, not the
  // login password) — hashed, never the raw 4 digits. Null on accounts
  // created before this existed; those can't send money until a PIN is set.
  tPinHash: string | null;
  // Exactly one of a user's accounts is primary at a time — it's where an
  // incoming payment-by-phone lands, and what Send Money defaults to.
  isPrimary: boolean;
  // User-chosen label ("Shop takings", "Rent") so two accounts of the same
  // type are distinguishable in the UI — falls back to a generic
  // "Personal •••• <id suffix>" display when null.
  nickname: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type AccountCreationAttributes = Optional<
  AccountAttributes,
  'id' | 'status' | 'tPinHash' | 'isPrimary' | 'nickname' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  declare id: string;
  declare userId: string;
  declare type: AccountType;
  declare status: AccountStatus;
  declare tPinHash: string | null;
  declare isPrimary: boolean;
  declare nickname: string | null;
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    // STRING + validate.isIn, not a native Postgres ENUM — ENUM columns
    // can't be reliably ALTERed by sync() once data exists (see the
    // gateway's users.role for the exact failure this avoids).
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['payer', 'payee', 'merchant', 'platform']] },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'frozen', 'closed']] },
    },
    tPinHash: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 't_pin_hash',
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary',
    },
    nickname: {
      type: DataTypes.STRING(40),
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
    modelName: 'Account',
    tableName: 'accounts',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id'] }],
  }
);
