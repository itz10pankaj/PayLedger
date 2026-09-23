import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/db';
import { EXPENSE_CATEGORIES } from '../categories';

// A recurring monthly spending limit per category — not tied to a
// specific month. "Monthly budget" and "Financial health" both read
// this and compare it against that month's tagged spend, computed on
// the fly from ledger_entries + ledger_entry_tags.
interface BudgetAttributes {
  id: string;
  userId: string;
  category: string;
  limitMinor: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type BudgetCreationAttributes = Optional<BudgetAttributes, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>;

export class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  declare id: string;
  declare userId: string;
  declare category: string;
  declare limitMinor: number;
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Budget.init(
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
    category: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: { isIn: [[...EXPENSE_CATEGORIES]] },
    },
    limitMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'limit_minor',
      // Same BIGINT-comes-back-as-a-string gotcha as ledger_entries.amount_minor.
      get(): number {
        const raw = this.getDataValue('limitMinor');
        return raw === null ? (raw as unknown as number) : Number(raw);
      },
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
    modelName: 'Budget',
    tableName: 'budgets',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['user_id', 'category'] }],
  }
);
