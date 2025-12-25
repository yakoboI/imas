const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockSession = sequelize.define('StockSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  opening_time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:01:00'
  },
  closing_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED'),
    defaultValue: 'OPEN'
  },
  auto_opened: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auto_closed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  opening_stock_snapshot: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  closing_stock_snapshot: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  opening_stock_value: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  closing_stock_value: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  total_receipts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pdf_report_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'stock_sessions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['tenant_id', 'date'], unique: true }
  ]
});

module.exports = StockSession;

