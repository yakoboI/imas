const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

class AuthService {
  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token for user
  static generateUserToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  // Generate JWT token for superadmin
  static generateSuperAdminToken(superadmin) {
    return jwt.sign(
      {
        superadminId: superadmin.id,
        email: superadmin.email,
        role: 'superadmin'
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
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
      throw new Error('Account is inactive or suspended');
    }

    if (user.tenant.status !== 'active') {
      throw new Error('Tenant account is suspended');
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

    const token = this.generateUserToken(user);

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
    const superadmin = await SuperAdmin.findOne({ where: { email } });

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

    // Update last login
    await superadmin.update({ last_login: new Date() });

    const token = this.generateSuperAdminToken(superadmin);

    return {
      token,
      superadmin: {
        id: superadmin.id,
        email: superadmin.email,
        name: superadmin.name,
        role: superadmin.role
      }
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

