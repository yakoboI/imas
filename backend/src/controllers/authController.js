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

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const user = await User.findOne({ where: { email } });

      // Don't reveal if user exists (security best practice)
      if (!user) {
        return res.json({ 
          message: 'If the email exists, a password reset link has been sent to your email address.' 
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.json({ 
          message: 'If the email exists, a password reset link has been sent to your email address.' 
        });
      }

      // Generate secure reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set token expiry to 1 hour from now
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      // Store token and expiry in database
      await user.update({
        password_reset_token: resetToken,
        password_reset_expires: resetTokenExpiry
      });

      // Send password reset email
      const emailService = require('../services/emailService');
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken, user.first_name || 'User');
      } catch (emailError) {
        // If email fails, clear the token so user can request again
        await user.update({
          password_reset_token: null,
          password_reset_expires: null
        });
        console.error('Failed to send password reset email:', emailError);
        // Still return success message for security (don't reveal email issues)
      }

      res.json({ 
        message: 'If the email exists, a password reset link has been sent to your email address.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
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

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Find user by reset token
      const user = await User.findOne({
        where: {
          password_reset_token: token
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token has expired
      if (!user.password_reset_expires || new Date() > new Date(user.password_reset_expires)) {
        // Clear expired token
        await user.update({
          password_reset_token: null,
          password_reset_expires: null
        });
        return res.status(400).json({ error: 'Reset token has expired. Please request a new password reset.' });
      }

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(newPassword);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null
      });

      // Log password reset action
      try {
        await AuditService.logAction({
          tenant_id: user.tenant_id,
          user_id: user.id,
          action: 'PASSWORD_RESET',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          description: 'User reset password via email link'
        });
      } catch (auditError) {
        // Don't fail if audit logging fails
        console.error('Failed to log password reset audit:', auditError);
      }

      res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      next(error);
    }
  }
}

module.exports = AuthController;

