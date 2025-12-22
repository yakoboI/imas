const AuthService = require('../services/authService');
const AuditService = require('../services/auditService');
const SystemSettingsService = require('../services/systemSettingsService');
const { Tenant, User, SuperAdmin, SystemLog, AuditLog } = require('../models/index');
const { Op } = require('sequelize');

class SuperAdminController {
  // SuperAdmin login
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.loginSuperAdmin(email, password);

      // Log to system logs
      await SystemLog.create({
        superadmin_id: result.superadmin.id,
        action: 'LOGIN',
        description: `SuperAdmin ${email} logged in`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  // Logout
  static async logout(req, res, next) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get all tenants
  static async getAllTenants(req, res, next) {
    try {
      const { page = 1, limit = 50, status, planType } = req.query;

      const where = {};
      if (status) where.status = status;
      if (planType) where.plan_type = planType;

      const offset = (page - 1) * limit;

      const { count, rows } = await Tenant.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        tenants: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create tenant
  static async createTenant(req, res, next) {
    try {
      const { name, subdomain, planType, maxUsers } = req.body;

      if (!name || !subdomain) {
        return res.status(400).json({ error: 'Name and subdomain are required' });
      }

      // Check if subdomain exists
      const existing = await Tenant.findOne({ where: { subdomain } });
      if (existing) {
        return res.status(409).json({ error: 'Subdomain already taken' });
      }

      const tenant = await Tenant.create({
        name,
        subdomain,
        plan_type: planType || 'free',
        max_users: maxUsers || 5,
        status: 'active'
      });

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'CREATE_TENANT',
        target_tenant_id: tenant.id,
        description: `Tenant ${name} created`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant by ID
  static async getTenantById(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id, {
        include: [
          { model: User, as: 'users', attributes: ['id', 'email', 'first_name', 'last_name', 'role'] }
        ]
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  // Update tenant
  static async updateTenant(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const oldValues = { ...tenant.toJSON() };

      await tenant.update(req.body);

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'UPDATE_TENANT',
        target_tenant_id: id,
        description: `Tenant ${id} updated`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({
        message: 'Tenant updated successfully',
        tenant
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete tenant
  static async deleteTenant(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await tenant.destroy();

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'DELETE_TENANT',
        target_tenant_id: id,
        description: `Tenant ${id} deleted`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Suspend tenant
  static async suspendTenant(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await tenant.update({ status: 'suspended' });

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'SUSPEND_TENANT',
        target_tenant_id: id,
        description: `Tenant ${id} suspended`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ message: 'Tenant suspended successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Activate tenant
  static async activateTenant(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await tenant.update({ status: 'active' });

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'ACTIVATE_TENANT',
        target_tenant_id: id,
        description: `Tenant ${id} activated`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ message: 'Tenant activated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant statistics
  static async getTenantStats(req, res, next) {
    try {
      const { id } = req.params;

      const userCount = await User.count({ where: { tenant_id: id } });
      // Add more stats as needed

      res.json({
        userCount,
        // Add more stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all users (across tenants)
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 50, tenantId } = req.query;

      const where = {};
      if (tenantId) where.tenant_id = tenantId;

      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name', 'subdomain'] }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Tenant, as: 'tenant' }]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  // Reset user password
  static async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await AuthService.hashPassword(newPassword);
      await user.update({ password: hashedPassword });

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'RESET_USER_PASSWORD',
        target_tenant_id: user.tenant_id,
        description: `Password reset for user ${id}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Deactivate user
  static async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ status: 'inactive' });

      // Log system action
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'DEACTIVATE_USER',
        target_tenant_id: user.tenant_id,
        description: `User ${id} deactivated`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get global audit logs
  static async getGlobalAuditLogs(req, res, next) {
    try {
      const filters = {
        tenantId: req.query.tenantId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userId: req.query.userId,
        action: req.query.action,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await AuditService.getGlobalAuditLogs(filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get tenant audit logs
  static async getTenantAuditLogs(req, res, next) {
    try {
      const { id } = req.params;
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await AuditService.getAuditLogs(id, filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Search audit logs
  static async searchAuditLogs(req, res, next) {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({ error: 'Search keyword is required' });
      }

      // Search across all tenants
      const logs = await AuditLog.findAll({
        where: {
          [Op.or]: [
            { action: { [Op.iLike]: `%${keyword}%` } },
            { entity_type: { [Op.iLike]: `%${keyword}%` } },
            { description: { [Op.iLike]: `%${keyword}%` } }
          ]
        },
        include: [
          { 
            model: User, 
            as: 'user', 
            attributes: ['id', 'email', 'first_name', 'last_name'],
            required: false
          },
          { 
            model: Tenant, 
            as: 'tenant', 
            attributes: ['id', 'name', 'subdomain'],
            required: false
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 100
      });

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Export audit logs
  static async exportAuditLogs(req, res, next) {
    try {
      const filters = {
        tenantId: req.body.tenantId,
        startDate: req.body.startDate,
        endDate: req.body.endDate
      };

      const { logs } = await AuditService.getGlobalAuditLogs({ ...filters, limit: 10000 });

      const csv = [
        'Timestamp,Tenant,User,Action,Entity Type,Entity ID,Description',
        ...logs.map(log => [
          log.timestamp,
          log.tenant?.name || 'N/A',
          log.user?.email || 'N/A',
          log.action,
          log.entity_type,
          log.entity_id || 'N/A',
          log.description || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=global-audit-logs.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  // Get system logs
  static async getSystemLogs(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await SystemLog.findAndCountAll({
        include: [
          { model: SuperAdmin, as: 'superadmin', attributes: ['id', 'email', 'name'] },
          { model: Tenant, as: 'targetTenant', attributes: ['id', 'name'] }
        ],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get analytics overview
  static async getAnalyticsOverview(req, res, next) {
    try {
      const totalTenants = await Tenant.count();
      const activeTenants = await Tenant.count({ where: { status: 'active' } });
      const totalUsers = await User.count();
      // Add more metrics

      res.json({
        totalTenants,
        activeTenants,
        totalUsers
      });
    } catch (error) {
      next(error);
    }
  }

  // Get revenue reports
  static async getRevenueReports(req, res, next) {
    try {
      // Implement revenue reporting
      res.json({ message: 'Revenue reports coming soon' });
    } catch (error) {
      next(error);
    }
  }

  // Get usage statistics
  static async getUsageStatistics(req, res, next) {
    try {
      // Implement usage statistics
      res.json({ message: 'Usage statistics coming soon' });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant growth
  static async getTenantGrowth(req, res, next) {
    try {
      // Implement tenant growth metrics
      res.json({ message: 'Tenant growth metrics coming soon' });
    } catch (error) {
      next(error);
    }
  }

  // Get system health
  static async getSystemHealth(req, res, next) {
    try {
      const { testConnection } = require('../config/database');
      const dbStatus = await testConnection();

      res.json({
        status: 'ok',
        database: dbStatus ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Trigger backup
  static async triggerBackup(req, res, next) {
    try {
      // Implement backup trigger
      res.json({ message: 'Backup triggered successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get system settings
  static async getSystemSettings(req, res, next) {
    try {
      const settings = await SystemSettingsService.getSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Error in getSystemSettings:', error);
      next(error);
    }
  }

  // Update system settings
  static async updateSystemSettings(req, res, next) {
    try {
      const settings = await SystemSettingsService.saveSettings(req.body);
      
      // Log system action (non-blocking)
      SystemLog.create({
        superadmin_id: req.user.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        description: `System settings updated by ${req.user.email}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      }).catch(err => {
        console.error('Failed to log system settings update:', err);
      });
      
      res.json({ 
        message: 'Settings updated successfully',
        settings 
      });
    } catch (error) {
      console.error('Error in updateSystemSettings:', error);
      next(error);
    }
  }
}

module.exports = SuperAdminController;

