const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
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
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  order_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'credit', 'pesapal', 'flutterwave', 'dpo'),
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'partial', 'refunded'),
    defaultValue: 'pending'
  },
  payment_reference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  payment_gateway: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['order_number'], unique: true },
    { fields: ['customer_id'] },
    { fields: ['order_date'] },
    { fields: ['status'] },
    { fields: ['tenant_id', 'order_date'] },
    { fields: ['payment_reference'] },
    { fields: ['payment_gateway'] }
  ]
});

module.exports = Order;

