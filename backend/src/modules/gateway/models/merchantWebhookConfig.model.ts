import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../config/db';
import type { MerchantWebhookConfigAttributes, MerchantWebhookConfigCreationAttributes } from './schema';

export class MerchantWebhookConfig
  extends Model<MerchantWebhookConfigAttributes, MerchantWebhookConfigCreationAttributes>
  implements MerchantWebhookConfigAttributes
{
  declare accountId: string;
  declare webhookUrl: string;
  declare webhookSecret: string;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MerchantWebhookConfig.init(
  {
    accountId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'account_id',
      references: { model: 'accounts', key: 'id' },
    },
    webhookUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'webhook_url',
    },
    webhookSecret: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'webhook_secret',
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
    modelName: 'MerchantWebhookConfig',
    tableName: 'merchant_webhook_configs',
    underscored: true,
    timestamps: true,
  }
);
