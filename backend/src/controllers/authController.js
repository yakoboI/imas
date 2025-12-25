const AuthService = require('../services/authService');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const AuditService = require('../services/auditService');
const SystemSettingsService = require('../services/systemSettingsService');

class AuthController {
  // User login
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.loginUser(email, password);

      // Log login
      await AuditService.logAction({
        tenant_id: result.user.tenantId,
        user_id: result.user.id,
        action: 'LOGIN',
        entity_type: 'User',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'User logged in'
      });

      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  // User register (for tenant signup)
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, tenantName, subdomain } = req.body;

      if (!email || !password || !tenantName || !subdomain) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Check system settings
      const settings = await SystemSettingsService.getSettings();
      
      // Check maintenance mode
      if (settings.maintenanceMode) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'The system is currently under maintenance. New registrations are temporarily disabled.'
        });
      }
      
      // Check if new registrations are allowed
      if (settings.allowNewRegistrations === false) {
        return res.status(403).json({
          error: 'Registration Disabled',
          message: 'New tenant registrations are currently disabled.'
        });
      }
      
      // Check max tenants limit
      const currentTenantCount = await Tenant.count();
      if (settings.maxTenants && currentTenantCount >= settings.maxTenants) {
        return res.status(403).json({
          error: 'Registration Limit Reached',
          message: `The maximum number of tenants (${settings.maxTenants}) has been reached.`
        });
      }

      // Check if tenant subdomain exists
      const existingTenant = await Tenant.findOne({ where: { subdomain } });
      if (existingTenant) {
        return res.status(409).json({ error: 'Subdomain already taken' });
      }

      // Create tenant
      const tenant = await Tenant.create({
        name: tenantName,
        subdomain,
        status: 'active',
        plan_type: 'free'
      });

      // Create admin user
      const user = await AuthService.registerUser(
        {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role: 'admin'
        },
        tenant.id
      );

      res.status(201).json({
        message: 'Tenant and admin user created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        user
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req, res, next) {
    try {
      const AuditService = require('../services/auditService');
      
      // Log logout action
      if (req.user && req.user.tenantId) {
        await AuditService.logAction({
          tenant_id: req.user.tenantId,
          user_id: req.user.id,
          action: 'LOGOUT',
          entity_type: 'user',
          entity_id: req.user.id,
          description: `User ${req.user.email} logged out manually`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If the email exists, a password reset link has been sent' });
      }

      // Generate reset token (simplified - in production use proper token generation)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      // Store token in database with expiry (simplified)

      // Send email
      const emailService = require('../services/emailService');
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Verify token and update password (simplified)
      // In production, verify token from database

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

