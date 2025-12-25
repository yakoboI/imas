const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockAdjustment = sequelize.define('StockAdjustment', {
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
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stock_sessions',
      key: 'id'
    }
  },
  sub_session_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sub_sessions',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  old_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  new_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  adjustment_type: {
    type: DataTypes.ENUM('addition', 'removal', 'correction'),
    allowNull: false
  },
  adjusted_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'stock_adjustments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['session_id'] },
    { fields: ['sub_session_id'] },
    { fields: ['product_id'] },
    { fields: ['timestamp'] }
  ]
});

module.exports = StockAdjustment;

