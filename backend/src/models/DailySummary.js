const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailySummary = sequelize.define('DailySummary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stock_sessions',
      key: 'id'
    }
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  opening_value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  closing_value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_receipts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  value_of_goods_sold: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  variance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  pdf_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  summary_data: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'daily_summaries',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['session_id'], unique: true },
    { fields: ['tenant_id'] },
    { fields: ['date'] },
    { fields: ['generated_at'] }
  ]
});

module.exports = DailySummary;

