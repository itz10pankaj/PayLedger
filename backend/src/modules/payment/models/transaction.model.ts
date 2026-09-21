import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';

export type TransactionStatus = 'completed' | 'failed';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `transactions` table to match this definition.
//
// One row per payment attempt. ledger_entries.transaction_id points here —
// this is the "why did money move" record; ledger_entries are the "money
// actually moved" record. idempotencyKey is scoped per requesting user
// (not globally unique) so two different users can't collide on the same
// client-generated key.
interface TransactionAttributes {
  id: string;
  idempotencyKey: string;
  requestingUserId: string;
  payerAccountId: string;
  payeeAccountId: string;
  amountMinor: number;
  feeMinor: number;
  status: TransactionStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type TransactionCreationAttributes = Optional<
  TransactionAttributes,
  'id' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: string;
  declare idempotencyKey: string;
  declare requestingUserId: string;
  declare payerAccountId: string;
  declare payeeAccountId: string;
  declare amountMinor: number;
  declare feeMinor: number;
  declare status: TransactionStatus;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'idempotency_key',
    },
    requestingUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'requesting_user_id',
    },
    payerAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payer_account_id',
      references: { model: 'accounts', key: 'id' },
    },
    payeeAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payee_account_id',
      references: { model: 'accounts', key: 'id' },
    },
    amountMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'amount_minor',
      get(): number {
        return Number(this.getDataValue('amountMinor'));
      },
    },
    feeMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'fee_minor',
      get(): number {
        return Number(this.getDataValue('feeMinor'));
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'completed',
      validate: { isIn: [['completed', 'failed']] },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['requesting_user_id', 'idempotency_key'] }],
  }
);
