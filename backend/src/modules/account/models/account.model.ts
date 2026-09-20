import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';

export type AccountType = 'payer' | 'payee' | 'merchant';
export type AccountStatus = 'active' | 'frozen' | 'closed';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `accounts` table to match this definition. No
// balance column: a balance is always SUM(ledger_entries.amount_minor).
interface AccountAttributes {
  id: string;
  userId: string;
  type: AccountType;
  status: AccountStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type AccountCreationAttributes = Optional<
  AccountAttributes,
  'id' | 'status' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  declare id: string;
  declare userId: string;
  declare type: AccountType;
  declare status: AccountStatus;
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
      validate: { isIn: [['payer', 'payee', 'merchant']] },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'frozen', 'closed']] },
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
