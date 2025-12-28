const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Integration = sequelize.define('Integration', {
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
  integration_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['pesapal', 'flutterwave', 'dpo', 'shopify', 'quickbooks', 'xero', 'whatsapp']]
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error', 'pending_verification'),
    defaultValue: 'inactive'
  },
  credentials: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  configuration: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'integrations',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['integration_type', 'status'] },
    { fields: ['tenant_id', 'status'] },
    { fields: ['tenant_id', 'integration_type'], unique: true }
  ]
});

module.exports = Integration;

