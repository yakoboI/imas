const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const SystemSettingsService = require('./systemSettingsService');

class AuthService {
  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Get session timeout from system settings (in seconds) and convert to JWT format
  static async getSessionTimeout() {
    try {
      const settings = await SystemSettingsService.getSettings();
      const timeoutSeconds = settings.sessionTimeout || 3600; // Default 1 hour
      
      // Convert seconds to JWT expiresIn format (e.g., "1h", "30m")
      if (timeoutSeconds < 60) {
        return `${timeoutSeconds}s`;
      } else if (timeoutSeconds < 3600) {
        return `${Math.floor(timeoutSeconds / 60)}m`;
      } else if (timeoutSeconds < 86400) {
        return `${Math.floor(timeoutSeconds / 3600)}h`;
      } else {
        return `${Math.floor(timeoutSeconds / 86400)}d`;
      }
    } catch (error) {
      console.error('Error getting session timeout, using default:', error);
      return jwtConfig.expiresIn; // Fallback to default
    }
  }

  // Generate JWT token for user
  static async generateUserToken(user) {
    const expiresIn = await this.getSessionTimeout();
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
      },
      jwtConfig.secret,
      { expiresIn }
    );
  }

  // Generate JWT token for superadmin
  static async generateSuperAdminToken(superadmin) {
    const expiresIn = await this.getSessionTimeout();
    return jwt.sign(
      {
        superadminId: superadmin.id,
        email: superadmin.email,
        role: 'superadmin'
      },
      jwtConfig.secret,
      { expiresIn }
    );
  }

  // User login
  static async loginUser(email, password) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: require('../models/Tenant'), as: 'tenant' }]
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}. Please contact your administrator.`);
    }

    if (!user.tenant) {
      throw new Error('User tenant not found');
    }

    if (user.tenant.status !== 'active') {
      throw new Error('Tenant account is suspended. Please contact support.');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.update({
      last_login: new Date(),
      login_count: (user.login_count || 0) + 1
    });

    const token = await this.generateUserToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain
        }
      }
    };
  }

  // SuperAdmin login
  static async loginSuperAdmin(email, password) {
    // Check if avatar_url column exists in the database
    const { sequelize } = require('../config/database');
    let hasAvatarUrlColumn = false;
    
    try {
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'superadmins' AND column_name = 'avatar_url'
      `);
      hasAvatarUrlColumn = results.length > 0;
    } catch (error) {
      // If query fails, assume column doesn't exist
      hasAvatarUrlColumn = false;
    }

    // Build attributes list based on whether avatar_url column exists
    const attributes = ['id', 'email', 'password', 'name', 'role', 'status', 'last_login'];
    if (hasAvatarUrlColumn) {
      attributes.push('avatar_url');
    }

    const superadmin = await SuperAdmin.findOne({ 
      where: { email },
      attributes: attributes
    });

    if (!superadmin) {
      throw new Error('Invalid email or password');
    }

    if (superadmin.status !== 'active') {
      throw new Error('Account is inactive');
    }

    const isPasswordValid = await this.comparePassword(password, superadmin.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login (only update last_login, not avatar_url)
    await superadmin.update({ last_login: new Date() });

    const token = await this.generateSuperAdminToken(superadmin);

    // Build response object, handling case where avatar_url might be undefined
    const superadminResponse = {
      id: superadmin.id,
      email: superadmin.email,
      name: superadmin.name,
      role: superadmin.role
    };

    // Only include avatar_url if it exists (column exists and has a value)
    if (hasAvatarUrlColumn && superadmin.avatar_url !== undefined && superadmin.avatar_url !== null) {
      superadminResponse.avatar_url = superadmin.avatar_url;
    }

    return {
      token,
      superadmin: superadminResponse
    };
  }

  // Register new user (admin only)
  static async registerUser(userData, tenantId) {
    const hashedPassword = await this.hashPassword(userData.password);

    const user = await User.create({
      ...userData,
      tenant_id: tenantId,
      password: hashedPassword
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await user.update({ password: hashedPassword });

    return { message: 'Password changed successfully' };
  }
}

module.exports = AuthService;

