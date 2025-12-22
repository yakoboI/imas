const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { testConnection } = require('./config/database');
const { sequelize } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logging');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load models and set up associations
require('./models/index');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const receiptRoutes = require('./routes/receipt.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const orderRoutes = require('./routes/order.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const tenantSettingsRoutes = require('./routes/tenantSettings.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.SUPERADMIN_URL || 'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(apiLimiter);

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Inventory Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      profile: '/api/profile',
      products: '/api/products',
      categories: '/api/categories',
      customers: '/api/customers',
      suppliers: '/api/suppliers',
      warehouses: '/api/warehouses',
      inventory: '/api/inventory',
      orders: '/api/orders',
      users: '/api/users',
      receipts: '/api/receipts',
      audit: '/api/audit',
      dashboard: '/api/dashboard',
      superadmin: '/api/superadmin',
      tenantSettings: '/api/tenant-settings'
    },
    documentation: 'All routes require authentication except /api/auth'
  });
});

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// IMPORTANT: Specific routes must come before generic routes (like /:id)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/tenant-settings', tenantSettingsRoutes);
// Profile routes - routes have /profile prefix, mount at /api (must be last to avoid conflicts)
app.use('/api', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
      console.log('⚠️  Database sync disabled. Use migrations in production.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

