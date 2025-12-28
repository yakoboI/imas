const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Receipt = sequelize.define('Receipt', {
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
  receipt_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  issue_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'credit', 'pesapal', 'flutterwave', 'dpo'),
    allowNull: true
  },
  template_type: {
    type: DataTypes.ENUM('thermal', 'a4', 'invoice', 'email'),
    defaultValue: 'thermal'
  },
  pdf_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  html_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'voided', 'cancelled'),
    defaultValue: 'active'
  },
  voided_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  voided_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  void_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // TRA EFDMS Integration Fields
  tra_receipt_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tra_qr_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tra_fiscal_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tra_submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tra_submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tra_submission_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Accounting Software Integration Fields
  synced_to_accounting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accounting_invoice_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  accounting_synced_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accounting_sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  accounting_provider: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'receipts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['receipt_number'], unique: true },
    { fields: ['order_id'] },
    { fields: ['customer_id'] },
    { fields: ['issue_date'] },
    { fields: ['status'] },
    { fields: ['tenant_id', 'issue_date'] },
    { fields: ['synced_to_accounting', 'accounting_provider'] },
    { fields: ['accounting_invoice_id'] }
  ]
});

module.exports = Receipt;

