const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Passkey = sequelize.define('Passkey', {
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
  credential_id: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  public_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  counter: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  device_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_passkeys',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // We don't update this table, only insert/delete
  indexes: [
    { fields: ['user_id'] },
    { fields: ['credential_id'] }
  ]
});

module.exports = Passkey;

