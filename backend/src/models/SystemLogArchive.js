const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemLogArchive = sequelize.define('SystemLogArchive', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  superadmin_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'superadmins',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  archived_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'system_logs_archive',
  timestamps: false,
  indexes: [
    { fields: ['superadmin_id'] },
    { fields: ['target_tenant_id'] },
    { fields: ['action'] },
    { fields: ['timestamp'] },
    { fields: ['archived_at'] }
  ]
});

module.exports = SystemLogArchive;

