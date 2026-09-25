import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../config/db';
import type { PaymentIntentAttributes, PaymentIntentCreationAttributes } from './schema';

export type { PaymentIntentStatus } from './schema';

export class PaymentIntent
  extends Model<PaymentIntentAttributes, PaymentIntentCreationAttributes>
  implements PaymentIntentAttributes
{
  declare id: string;
  declare merchantAccountId: string;
  declare payerPhone: string;
  declare amountMinor: number;
  declare status: PaymentIntentAttributes['status'];
  declare transactionId: string | null;
  declare idempotencyKey: string;
  declare expiresAt: Date;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PaymentIntent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    merchantAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'merchant_account_id',
      references: { model: 'accounts', key: 'id' },
    },
    payerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'payer_phone',
    },
    amountMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'amount_minor',
      get(): number {
        return Number(this.getDataValue('amountMinor'));
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'approved', 'declined', 'expired']] },
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'transaction_id',
      references: { model: 'transactions', key: 'id' },
    },
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'idempotency_key',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
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
    modelName: 'PaymentIntent',
    tableName: 'payment_intents',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['merchant_account_id', 'idempotency_key'] },
      { fields: ['payer_phone', 'status'] },
    ],
  }
);
