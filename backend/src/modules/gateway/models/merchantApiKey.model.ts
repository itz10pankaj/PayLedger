import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../config/db';
import type { MerchantApiKeyAttributes, MerchantApiKeyCreationAttributes } from './schema';

export type { MerchantApiKeyStatus } from './schema';

export class MerchantApiKey
  extends Model<MerchantApiKeyAttributes, MerchantApiKeyCreationAttributes>
  implements MerchantApiKeyAttributes
{
  declare id: string;
  declare accountId: string;
  declare keyId: string;
  declare secretHash: string;
  declare status: MerchantApiKeyAttributes['status'];
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MerchantApiKey.init(
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
    keyId: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: 'key_id',
    },
    secretHash: {
      // Fixed-length hex SHA-256 digest (64 chars) — see hashApiSecret.ts
      // for why this isn't bcrypt. unique + indexed so the public gateway
      // API's auth check is one direct lookup, not a table scan.
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'secret_hash',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'revoked']] },
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
    modelName: 'MerchantApiKey',
    tableName: 'merchant_api_keys',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['account_id'] }],
  }
);
