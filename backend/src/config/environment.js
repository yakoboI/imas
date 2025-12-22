require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  superadminUrl: process.env.SUPERADMIN_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  superadminEmail: process.env.SUPERADMIN_EMAIL || 'admin@inventorysystem.com',
  superadminPassword: process.env.SUPERADMIN_PASSWORD || 'ChangeThisPassword123!'
};

