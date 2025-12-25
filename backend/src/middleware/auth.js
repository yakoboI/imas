const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const { sequelize } = require('../config/database');

// Helper function to check if avatar_url column exists
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

// Regular user authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Check if it's a superadmin token
    if (decoded.superadminId) {
      const superadmin = await getSuperAdminSafely(decoded.superadminId);
      if (!superadmin || superadmin.status !== 'active') {
        return res.status(401).json({ error: 'Invalid or inactive superadmin account.' });
      }
      req.user = {
        id: superadmin.id,
        email: superadmin.email,
        role: 'superadmin',
        isSuperAdmin: true
      };
      return next();
    }

    // Regular user token
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: require('../models/Tenant'), as: 'tenant' }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user account.' });
    }

    if (user.tenant.status !== 'active') {
      return res.status(403).json({ error: 'Tenant account is suspended or inactive.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenant: user.tenant,
      isSuperAdmin: false
    };

    next();
  } catch (error) {
    // Check if token expired (automatic logout due to inactivity)
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      try {
        const AuditService = require('../services/auditService');
        
        // Try to decode the expired token to get user info
        let decoded;
        try {
          decoded = jwt.decode(req.header('Authorization')?.replace('Bearer ', ''));
        } catch (decodeError) {
          // If we can't decode, just return error without logging
          return res.status(401).json({ error: 'Invalid token.' });
        }
        
        // Log automatic logout for regular users
        if (decoded && decoded.userId) {
          const user = await User.findByPk(decoded.userId);
          if (user) {
            await AuditService.logAction({
              tenant_id: user.tenant_id,
              user_id: user.id,
              action: 'LOGOUT',
              entity_type: 'user',
              entity_id: user.id,
              description: `User ${user.email} automatically logged out due to session timeout/inactivity`,
              ip_address: req.ip,
              user_agent: req.headers['user-agent']
            });
          }
        }
        
        // Log automatic logout for superadmin
        if (decoded && decoded.superadminId) {
          const SystemLog = require('../models/SystemLog');
          const superadmin = await getSuperAdminSafely(decoded.superadminId);
          if (superadmin) {
            await SystemLog.create({
              superadmin_id: superadmin.id,
              action: 'LOGOUT',
              description: `SuperAdmin ${superadmin.email} automatically logged out due to session timeout/inactivity`,
              ip_address: req.ip,
              user_agent: req.headers['user-agent']
            });
          }
        }
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error('Error logging automatic logout:', logError);
      }
    }
    
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// SuperAdmin only middleware
const superAdminOnly = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'SuperAdmin access required.' });
  }
  next();
};

// Role-based authorization
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.isSuperAdmin) {
      return next(); // SuperAdmin can access everything
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  superAdminOnly,
  authorize
};

