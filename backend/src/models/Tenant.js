const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subdomain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'inactive'),
    defaultValue: 'active'
  },
  plan_type: {
    type: DataTypes.ENUM('free', 'basic', 'professional', 'enterprise'),
    defaultValue: 'free'
  },
  max_users: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  max_warehouses: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['subdomain'] },
    { fields: ['status'] }
  ]
});

module.exports = Tenant;

