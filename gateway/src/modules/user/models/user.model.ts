import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';

export type UserRole = 'payer' | 'payee' | 'merchant' | 'admin';

// This IS the schema — sequelize.sync() (run via `npm run migration`)
// creates/updates the `users` table to match this definition. Nothing
// else defines the table shape.
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdBy: string | null; // null = self-registered (signup), else the user id that created this record
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare passwordHash: string;
  declare role: UserRole;
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'password_hash',
    },
    // STRING + validate.isIn instead of a native Postgres ENUM — ENUM
    // types can't be reliably ALTERed by sync() once a column already
    // exists with data (Postgres can't auto-cast the old default), which
    // breaks the whole point of "one command sets up the DB anywhere".
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'payer',
      validate: { isIn: [['payer', 'payee', 'merchant', 'admin']] },
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
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
  }
);
