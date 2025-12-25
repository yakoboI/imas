const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertTracking = sequelize.define('AlertTracking', {
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
    },
    onDelete: 'CASCADE'
  },
  inventory_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'inventory',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  last_alert_sent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  alert_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'alert_tracking',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['inventory_id'] },
    { fields: ['tenant_id', 'inventory_id'], unique: true }
  ]
});

module.exports = AlertTracking;

