const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  p256dh: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  auth: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'push_subscriptions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'endpoint'], unique: true }
  ]
});

module.exports = PushSubscription;

