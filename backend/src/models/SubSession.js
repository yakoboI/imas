const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubSession = sequelize.define('SubSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  parent_session_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  opened_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  opened_by_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'CLOSED'),
    defaultValue: 'ACTIVE'
  },
  stock_snapshot: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'sub_sessions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['parent_session_id'] },
    { fields: ['tenant_id'] },
    { fields: ['status'] }
  ]
});

module.exports = SubSession;

