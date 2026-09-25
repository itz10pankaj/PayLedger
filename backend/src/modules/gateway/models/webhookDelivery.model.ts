import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../config/db';
import type { WebhookDeliveryAttributes, WebhookDeliveryCreationAttributes } from './schema';

export type { WebhookDeliveryStatus } from './schema';

export class WebhookDelivery
  extends Model<WebhookDeliveryAttributes, WebhookDeliveryCreationAttributes>
  implements WebhookDeliveryAttributes
{
  declare id: string;
  declare paymentIntentId: string;
  declare url: string;
  declare payload: Record<string, unknown>;
  declare status: WebhookDeliveryAttributes['status'];
  declare attempts: number;
  declare nextAttemptAt: Date;
  declare lastAttemptAt: Date | null;
  declare responseStatus: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WebhookDelivery.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentIntentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payment_intent_id',
      references: { model: 'payment_intents', key: 'id' },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'delivered', 'failed', 'dead']] },
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nextAttemptAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'next_attempt_at',
    },
    lastAttemptAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_attempt_at',
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'response_status',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'WebhookDelivery',
    tableName: 'webhook_deliveries',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status', 'next_attempt_at'] }],
  }
);
