const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IntegrationLog = sequelize.define('IntegrationLog', {
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
    allowNull: false
  },
  integration_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'integrations',
      key: 'id'
    }
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('success', 'error', 'pending'),
    defaultValue: 'success'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  external_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  related_entity_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  related_entity_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'integration_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // No updated_at for logs
  indexes: [
    { fields: ['tenant_id', 'integration_type'] },
    { fields: ['integration_id'] },
    { fields: ['related_entity_type', 'related_entity_id'] },
    { fields: ['created_at'] },
    { fields: ['status'] },
    { fields: ['external_id'] }
  ]
});

module.exports = IntegrationLog;

