const Tenant = require('./Tenant');
const SuperAdmin = require('./SuperAdmin');
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Warehouse = require('./Warehouse');
const Inventory = require('./Inventory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Receipt = require('./Receipt');
const ReceiptItem = require('./ReceiptItem');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const StockMovement = require('./StockMovement');
const Subscription = require('./Subscription');
const AuditLog = require('./AuditLog');
const SystemLog = require('./SystemLog');

// Define Relationships

// Tenant relationships
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
Tenant.hasMany(Receipt, { foreignKey: 'tenant_id', as: 'receipts' });
Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
Tenant.hasOne(Subscription, { foreignKey: 'tenant_id', as: 'subscription' });

// User relationships
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
User.belongsTo(User, { foreignKey: 'reports_to', as: 'manager' });
User.hasMany(User, { foreignKey: 'reports_to', as: 'subordinates' });
User.hasMany(Order, { foreignKey: 'created_by', as: 'orders' });
User.hasMany(Receipt, { foreignKey: 'created_by', as: 'receipts' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// Product relationships
Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(Inventory, { foreignKey: 'product_id', as: 'inventory' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
Product.hasMany(ReceiptItem, { foreignKey: 'product_id', as: 'receiptItems' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'stockMovements' });

// Category relationships
Category.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

// Warehouse relationships
Warehouse.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Warehouse.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id', as: 'inventory' });
Warehouse.hasMany(StockMovement, { foreignKey: 'warehouse_id', as: 'stockMovements' });

// Inventory relationships
Inventory.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// Order relationships
Order.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
Order.hasOne(Receipt, { foreignKey: 'order_id', as: 'receipt' });

// OrderItem relationships
OrderItem.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Receipt relationships
Receipt.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Receipt.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Receipt.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Receipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Receipt.belongsTo(User, { foreignKey: 'voided_by', as: 'voidedBy' });
Receipt.hasMany(ReceiptItem, { foreignKey: 'receipt_id', as: 'items', onDelete: 'CASCADE' });

// ReceiptItem relationships
ReceiptItem.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
ReceiptItem.belongsTo(Receipt, { foreignKey: 'receipt_id', as: 'receipt' });
ReceiptItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Customer relationships
Customer.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Customer.hasMany(Receipt, { foreignKey: 'customer_id', as: 'receipts' });

// Supplier relationships
Supplier.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// StockMovement relationships
StockMovement.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockMovement.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
StockMovement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Subscription relationships
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// AuditLog relationships
AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AuditLog.belongsTo(SuperAdmin, { foreignKey: 'superadmin_id', as: 'superadmin' });

// SystemLog relationships
SystemLog.belongsTo(SuperAdmin, { foreignKey: 'superadmin_id', as: 'superadmin' });
SystemLog.belongsTo(Tenant, { foreignKey: 'target_tenant_id', as: 'targetTenant' });

// SuperAdmin relationships
SuperAdmin.hasMany(SystemLog, { foreignKey: 'superadmin_id', as: 'systemLogs' });
SuperAdmin.hasMany(AuditLog, { foreignKey: 'superadmin_id', as: 'auditLogs' });

module.exports = {
  Tenant,
  SuperAdmin,
  User,
  Product,
  Category,
  Warehouse,
  Inventory,
  Order,
  OrderItem,
  Receipt,
  ReceiptItem,
  Customer,
  Supplier,
  StockMovement,
  Subscription,
  AuditLog,
  SystemLog
};

