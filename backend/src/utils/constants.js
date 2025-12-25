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
  },

  // Plan pricing (monthly in USD) and user/warehouse limits
  PLAN_PRICES: {
    free: {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
      name: 'Free',
      maxUsers: 5,
      maxWarehouses: 1,
      features: ['Basic features', 'Up to 5 users', '1 warehouse', 'Community support']
    },
    basic: {
      monthly: 29,
      quarterly: 79, // ~10% discount
      yearly: 290, // ~17% discount
      name: 'Basic',
      maxUsers: 6,
      maxWarehouses: 1,
      features: ['All free features', 'Up to 6 users', '1 warehouse', 'Email support', 'Basic reports']
    },
    professional: {
      monthly: 99,
      quarterly: 269, // ~10% discount
      yearly: 990, // ~17% discount
      name: 'Professional',
      maxUsers: 999999, // Effectively unlimited (999,999 users)
      maxWarehouses: 3,
      features: ['All basic features', 'Unlimited users', '3 warehouses', 'Priority support', 'Advanced reports', 'API access']
    },
    enterprise: {
      monthly: 299,
      quarterly: 809, // ~10% discount
      yearly: 2990, // ~17% discount
      name: 'Enterprise',
      maxUsers: 999999, // Effectively unlimited (999,999 users)
      maxWarehouses: 999999, // Effectively unlimited warehouses
      features: ['All professional features', 'Unlimited users', 'Unlimited warehouses', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'On-premise option']
    }
  },

  // Currency conversion rates (to USD) - Update these periodically or use an API
  CURRENCY_RATES: {
    USD: 1.0,
    EUR: 1.08,
    GBP: 1.27,
    JPY: 0.0067,
    CAD: 0.73,
    AUD: 0.65,
    INR: 0.012,
    CNY: 0.14,
    // Add more currencies as needed
  }
};

