const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(
      'admin',
      'sales_manager',
      'inventory_manager',
      'sales_staff',
      'inventory_staff',
      'accountant',
      'viewer'
    ),
    defaultValue: 'viewer'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  // Personal Information
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Address Information
  street_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state_province: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zip_postal_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Emergency Contact
  emergency_contact_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact_relationship: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Employment Info (Read-only, set by Admin)
  employee_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reports_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Notification Preferences
  notification_preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      lowStockAlerts: true,
      orderUpdates: true,
      reportDigests: false
    }
  },
  // Security
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  two_factor_secret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Personal Stats (Read-only)
  total_orders_processed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_products_added: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['email'] },
    { fields: ['tenant_id', 'email'] },
    { fields: ['status'] },
    { fields: ['role'] },
    { fields: ['password_reset_token'] }
  ]
});

module.exports = User;

