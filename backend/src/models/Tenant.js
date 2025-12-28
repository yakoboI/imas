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
  },
  // TRA EFDMS Integration Fields
  tenant_tin: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  vfd_serial_num: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tra_cert_pfx_base64: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cert_password: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  current_global_counter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_zreport_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tra_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tra_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tra_api_endpoint: {
    type: DataTypes.STRING(500),
    allowNull: true
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

