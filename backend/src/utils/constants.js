// Application constants

module.exports = {
  ROLES: {
    ADMIN: 'admin',
    SALES_MANAGER: 'sales_manager',
    INVENTORY_MANAGER: 'inventory_manager',
    SALES_STAFF: 'sales_staff',
    INVENTORY_STAFF: 'inventory_staff',
    ACCOUNTANT: 'accountant',
    VIEWER: 'viewer'
  },

  TENANT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive'
  },

  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  },

  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  RECEIPT_STATUS: {
    ACTIVE: 'active',
    VOIDED: 'voided',
    CANCELLED: 'cancelled'
  },

  RECEIPT_TEMPLATES: {
    THERMAL: 'thermal',
    A4: 'a4',
    INVOICE: 'invoice',
    EMAIL: 'email'
  },

  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    MOBILE_MONEY: 'mobile_money',
    CREDIT: 'credit'
  },

  STOCK_MOVEMENT_TYPES: {
    IN: 'in',
    OUT: 'out',
    TRANSFER: 'transfer',
    ADJUSTMENT: 'adjustment',
    RETURN: 'return'
  },

  PLAN_TYPES: {
    FREE: 'free',
    BASIC: 'basic',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise'
  }
};

