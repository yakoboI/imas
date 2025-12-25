const SystemSettingsService = require('../services/systemSettingsService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const SuperAdmin = require('../models/SuperAdmin');
const { sequelize } = require('../config/database');

// Helper function to check if avatar_url column exists (cached)
let avatarUrlColumnExists = null;
const checkAvatarUrlColumn = async () => {
  if (avatarUrlColumnExists !== null) {
    return avatarUrlColumnExists;
  }
  
  try {
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'superadmins' AND column_name = 'avatar_url'
    `);
    avatarUrlColumnExists = results.length > 0;
  } catch (error) {
    avatarUrlColumnExists = false;
  }
  
  return avatarUrlColumnExists;
};

// Helper function to get SuperAdmin with safe attribute selection
const getSuperAdminSafely = async (id) => {
  const hasAvatarUrl = await checkAvatarUrlColumn();
  const attributes = ['id', 'email', 'name', 'role', 'status', 'last_login'];
  if (hasAvatarUrl) {
    attributes.push('avatar_url');
  }
  
  return await SuperAdmin.findByPk(id, { attributes });
};

// Helper function to check if user is SuperAdmin from token
const isSuperAdminFromToken = async (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Check if it's a superadmin token (has superadminId property)
    if (decoded.superadminId) {
      const superadmin = await getSuperAdminSafely(decoded.superadminId);
      return superadmin && superadmin.status === 'active';
    }
    
    return false;
  } catch (err) {
    // Token invalid, expired, or not a superadmin token
    return false;
  }
};

// Middleware to check maintenance mode
// Allows SuperAdmin to bypass maintenance mode
// Skips check for health endpoint and auth routes (login/register handle their own checks)
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for health endpoint
    if (req.originalUrl === '/health' || req.originalUrl === '/') {
      return next();
    }
    
    // Skip maintenance check for auth routes (they handle their own checks)
    if (req.originalUrl.startsWith('/api/auth')) {
      return next();
    }
    
    // Get settings first to check maintenance mode
    const settings = await SystemSettingsService.getSettings();
    
    // If maintenance mode is disabled, allow all requests
    if (!settings.maintenanceMode) {
      return next();
    }
    
    // Maintenance mode is enabled - check for SuperAdmin bypass
    
    // Method 1: Check if user is already authenticated (from route-level middleware)
    // This happens when routes have authenticate middleware that runs before this
    if (req.user && req.user.isSuperAdmin === true) {
      return next();
    }
    
    // Method 2: Check token directly for SuperAdmin (since maintenance mode runs before route auth)
    const authHeader = req.header('Authorization') || req.header('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    
    if (token) {
      const isSuperAdmin = await isSuperAdminFromToken(token);
      if (isSuperAdmin) {
        // SuperAdmin can bypass maintenance mode
        return next();
      }
    }
    
    // Maintenance mode is enabled and user is not SuperAdmin - block request
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'The system is currently under maintenance. Please try again later.'
    });
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

module.exports = checkMaintenanceMode;

