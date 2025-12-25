const AuthService = require('../services/authService');
const AuditService = require('../services/auditService');
const SystemSettingsService = require('../services/systemSettingsService');
const { Tenant, User, SuperAdmin, SystemLog, SystemLogArchive, AuditLog, Subscription, Order } = require('../models/index');
const { sequelize } = require('../config/database');
const { Op, fn, col } = require('sequelize');
const constants = require('../utils/constants');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
      // Log logout action for superadmin
      await SystemLog.create({
        superadmin_id: req.user.id,
        action: 'LOGOUT',
        description: `SuperAdmin ${req.user.email} logged out manually`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
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

      // Get user and warehouse counts for each tenant
      const User = require('../models/User');
      const Warehouse = require('../models/Warehouse');
      
      const tenantsWithCounts = await Promise.all(
        rows.map(async (tenant) => {
          const userCount = await User.count({ 
            where: { tenant_id: tenant.id, status: 'active' } 
          });
          const warehouseCount = await Warehouse.count({ 
            where: { tenant_id: tenant.id, status: 'active' } 
          });
          
          return {
            ...tenant.toJSON(),
            user_count: userCount,
            warehouse_count: warehouseCount
          };
        })
      );

      res.json({
        tenants: tenantsWithCounts,
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
      const { name, subdomain, planType, maxUsers, maxWarehouses } = req.body;

      if (!name || !subdomain) {
        return res.status(400).json({ error: 'Name and subdomain are required' });
      }

      // Check if subdomain exists
      const existing = await Tenant.findOne({ where: { subdomain } });
      if (existing) {
        return res.status(409).json({ error: 'Subdomain already taken' });
      }

      // Get default max_users and max_warehouses based on plan if not provided
      const plan = planType || 'free';
      const defaultMaxUsers = constants.PLAN_PRICES[plan]?.maxUsers || 5;
      const defaultMaxWarehouses = constants.PLAN_PRICES[plan]?.maxWarehouses || 1;
      const finalMaxUsers = maxUsers || defaultMaxUsers;
      const finalMaxWarehouses = maxWarehouses || defaultMaxWarehouses;

      // Validate max_users is within plan limits
      const planMaxUsers = constants.PLAN_PRICES[plan]?.maxUsers || 5;
      if (finalMaxUsers > planMaxUsers) {
        return res.status(400).json({ 
          error: `Maximum users for ${plan} plan is ${planMaxUsers}. You cannot assign more than the plan allows.` 
        });
      }

      // Validate max_warehouses is within plan limits
      const planMaxWarehouses = constants.PLAN_PRICES[plan]?.maxWarehouses || 1;
      if (finalMaxWarehouses > planMaxWarehouses) {
        return res.status(400).json({ 
          error: `Maximum warehouses for ${plan} plan is ${planMaxWarehouses === 999999 ? 'unlimited' : planMaxWarehouses}. You cannot assign more than the plan allows.` 
        });
      }

      const tenant = await Tenant.create({
        name,
        subdomain,
        plan_type: plan,
        max_users: finalMaxUsers,
        max_warehouses: finalMaxWarehouses,
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
      const updateData = { ...req.body };
      const Warehouse = require('../models/Warehouse');

      // If plan_type is being updated, validate and set max_users and max_warehouses accordingly
      if (updateData.plan_type) {
        const planMaxUsers = constants.PLAN_PRICES[updateData.plan_type]?.maxUsers || 5;
        const planMaxWarehouses = constants.PLAN_PRICES[updateData.plan_type]?.maxWarehouses || 1;
        
        // If max_users is provided, validate it's within plan limits
        if (updateData.max_users && updateData.max_users > planMaxUsers) {
          return res.status(400).json({ 
            error: `Maximum users for ${updateData.plan_type} plan is ${planMaxUsers}. You cannot assign more than the plan allows.` 
          });
        }
        
        // If max_warehouses is provided, validate it's within plan limits
        if (updateData.max_warehouses && updateData.max_warehouses > planMaxWarehouses) {
          return res.status(400).json({ 
            error: `Maximum warehouses for ${updateData.plan_type} plan is ${planMaxWarehouses === 999999 ? 'unlimited' : planMaxWarehouses}. You cannot assign more than the plan allows.` 
          });
        }
        
        // If max_users not provided but plan changed, set default for new plan
        if (!updateData.max_users) {
          updateData.max_users = planMaxUsers;
        }
        
        // If max_warehouses not provided but plan changed, set default for new plan
        if (!updateData.max_warehouses) {
          updateData.max_warehouses = planMaxWarehouses;
        }
        
        // Check if current user count exceeds new max_users
        const currentUserCount = await User.count({ where: { tenant_id: id } });
        if (currentUserCount > updateData.max_users) {
          return res.status(400).json({ 
            error: `Cannot change plan: Tenant currently has ${currentUserCount} users, which exceeds the ${updateData.plan_type} plan limit of ${updateData.max_users} users. Please reduce users first or choose a higher plan.` 
          });
        }
        
        // Check if current warehouse count exceeds new max_warehouses
        const currentWarehouseCount = await Warehouse.count({ where: { tenant_id: id, status: 'active' } });
        if (currentWarehouseCount > updateData.max_warehouses) {
          return res.status(400).json({ 
            error: `Cannot change plan: Tenant currently has ${currentWarehouseCount} warehouse${currentWarehouseCount === 1 ? '' : 'es'}, which exceeds the ${updateData.plan_type} plan limit of ${updateData.max_warehouses === 999999 ? 'unlimited' : updateData.max_warehouses} warehouse${updateData.max_warehouses === 1 ? '' : 'es'}. Please reduce warehouses first or choose a higher plan.` 
          });
        }
      } else {
        // If only max_users is being updated, validate against current plan
        if (updateData.max_users) {
          const planMaxUsers = constants.PLAN_PRICES[tenant.plan_type]?.maxUsers || 5;
          if (updateData.max_users > planMaxUsers) {
            return res.status(400).json({ 
              error: `Maximum users for ${tenant.plan_type} plan is ${planMaxUsers}. You cannot assign more than the plan allows.` 
            });
          }
          
          // Check if current user count exceeds new max_users
          const currentUserCount = await User.count({ where: { tenant_id: id } });
          if (currentUserCount > updateData.max_users) {
            return res.status(400).json({ 
              error: `Cannot set max_users to ${updateData.max_users}: Tenant currently has ${currentUserCount} users. Please reduce users first.` 
            });
          }
        }
        
        // If only max_warehouses is being updated, validate against current plan
        if (updateData.max_warehouses) {
          const planMaxWarehouses = constants.PLAN_PRICES[tenant.plan_type]?.maxWarehouses || 1;
          if (updateData.max_warehouses > planMaxWarehouses) {
            return res.status(400).json({ 
              error: `Maximum warehouses for ${tenant.plan_type} plan is ${planMaxWarehouses === 999999 ? 'unlimited' : planMaxWarehouses}. You cannot assign more than the plan allows.` 
            });
          }
          
          // Check if current warehouse count exceeds new max_warehouses
          const currentWarehouseCount = await Warehouse.count({ where: { tenant_id: id, status: 'active' } });
          if (currentWarehouseCount > updateData.max_warehouses) {
            return res.status(400).json({ 
              error: `Cannot set max_warehouses to ${updateData.max_warehouses}: Tenant currently has ${currentWarehouseCount} warehouse${currentWarehouseCount === 1 ? '' : 'es'}. Please reduce warehouses first.` 
            });
          }
        }
      }

      await tenant.update(updateData);

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
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id, { transaction });
      if (!tenant) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const tenantName = tenant.name;
      const tenantId = tenant.id;

      // Delete all system_logs that reference this tenant first (they don't have CASCADE DELETE)
      await SystemLog.destroy({
        where: { target_tenant_id: tenantId },
        transaction
      });

      // Delete tenant (cascade will handle all other related records)
      await tenant.destroy({ transaction });

      // Log system action AFTER successful deletion (set target_tenant_id to null)
      try {
        await SystemLog.create({
          superadmin_id: req.user.id,
          action: 'DELETE_TENANT',
          target_tenant_id: null, // Set to null since tenant is already deleted
          description: `Tenant ${tenantName} (${tenantId}) deleted`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch (logError) {
        console.error('Failed to log tenant deletion (non-critical):', logError);
        // Don't fail the request if logging fails
      }

      await transaction.commit();

      res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      
      // Provide more detailed error messages
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ 
          error: 'Cannot delete tenant. There are still related records that need to be removed first.',
          details: error.message 
        });
      }
      
      console.error('Error deleting tenant:', error);
      res.status(500).json({ 
        error: 'Failed to delete tenant',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

  // Archive system logs
  static async archiveSystemLogs(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { beforeDate, daysOld } = req.body;

      // Determine the cutoff date
      let cutoffDate;
      if (beforeDate) {
        cutoffDate = new Date(beforeDate);
      } else if (daysOld) {
        const days = parseInt(daysOld);
        if (isNaN(days) || days < 1) {
          await transaction.rollback();
          return res.status(400).json({ error: 'daysOld must be a positive number' });
        }
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
      } else {
        await transaction.rollback();
        return res.status(400).json({ 
          error: 'Either beforeDate or daysOld is required',
          example: {
            beforeDate: '2024-01-01T00:00:00Z',
            daysOld: 90
          }
        });
      }

      // Validate date
      if (isNaN(cutoffDate.getTime())) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Find logs to archive (older than cutoff date)
      const logsToArchive = await SystemLog.findAll({
        where: {
          timestamp: {
            [Op.lt]: cutoffDate
          }
        },
        transaction
      });

      if (logsToArchive.length === 0) {
        await transaction.rollback();
        return res.json({
          message: 'No logs found to archive',
          archivedCount: 0,
          cutoffDate: cutoffDate.toISOString()
        });
      }

      // Copy logs to archive table
      const archiveData = logsToArchive.map(log => ({
        id: log.id,
        superadmin_id: log.superadmin_id,
        action: log.action,
        target_tenant_id: log.target_tenant_id,
        description: log.description,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        timestamp: log.timestamp,
        archived_at: new Date()
      }));

      await SystemLogArchive.bulkCreate(archiveData, { transaction });

      // Delete archived logs from main table
      const deletedCount = await SystemLog.destroy({
        where: {
          id: {
            [Op.in]: logsToArchive.map(log => log.id)
          }
        },
        transaction
      });

      await transaction.commit();

      // Log the archive action
      try {
        await SystemLog.create({
          superadmin_id: req.user.id,
          action: 'ARCHIVE_SYSTEM_LOGS',
          description: `Archived ${deletedCount} system logs older than ${cutoffDate.toISOString()}`,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch (logError) {
        console.error('Failed to log archive action (non-critical):', logError);
      }

      res.json({
        message: 'System logs archived successfully',
        archivedCount: deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error archiving system logs:', error);
      next(error);
    }
  }

  // Convert currency to USD
  static convertToUSD(amount, fromCurrency = 'USD') {
    if (!amount || amount === 0) return 0;
    if (fromCurrency === 'USD') return parseFloat(amount);
    
    const rate = constants.CURRENCY_RATES[fromCurrency.toUpperCase()] || 1.0;
    return parseFloat(amount) * rate;
  }

  // Get analytics overview
  static async getAnalyticsOverview(req, res, next) {
    try {
      const totalTenants = await Tenant.count();
      const activeTenants = await Tenant.count({ where: { status: 'active' } });
      const totalUsers = await User.count();
      
      // Calculate revenue from active subscriptions first
      const activeSubscriptions = await Subscription.findAll({
        where: { status: 'active' },
        attributes: ['amount', 'currency', 'billing_cycle', 'tenant_id']
      });

      let totalRevenueUSD = 0;
      let monthlyRevenueUSD = 0;
      const tenantsWithSubscriptions = new Set();
      
      activeSubscriptions.forEach(sub => {
        const amountUSD = this.convertToUSD(sub.amount, sub.currency);
        totalRevenueUSD += amountUSD;
        tenantsWithSubscriptions.add(sub.tenant_id);
        
        // Calculate monthly equivalent
        let monthlyAmount = amountUSD;
        if (sub.billing_cycle === 'quarterly') {
          monthlyAmount = amountUSD / 3;
        } else if (sub.billing_cycle === 'yearly') {
          monthlyAmount = amountUSD / 12;
        }
        monthlyRevenueUSD += monthlyAmount;
      });

      // Also calculate revenue from tenant plan types (for tenants without subscriptions)
      // This ensures we show real revenue even if subscriptions aren't set up
      if (tenantsWithSubscriptions.size > 0) {
        const tenantsWithoutSubscriptions = await Tenant.findAll({
          where: {
            status: 'active',
            id: { [Op.notIn]: Array.from(tenantsWithSubscriptions) }
          },
          attributes: ['id', 'plan_type']
        });

        tenantsWithoutSubscriptions.forEach(tenant => {
          const planPrice = constants.PLAN_PRICES[tenant.plan_type]?.monthly || 0;
          if (planPrice > 0) {
            totalRevenueUSD += planPrice;
            monthlyRevenueUSD += planPrice;
          }
        });
      } else {
        // If no subscriptions exist, calculate revenue from all active tenants based on their plans
        const allActiveTenants = await Tenant.findAll({
          where: { status: 'active' },
          attributes: ['id', 'plan_type']
        });

        allActiveTenants.forEach(tenant => {
          const planPrice = constants.PLAN_PRICES[tenant.plan_type]?.monthly || 0;
          if (planPrice > 0) {
            totalRevenueUSD += planPrice;
            monthlyRevenueUSD += planPrice;
          }
        });
      }

      // Get current month's revenue (from subscriptions started this month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const thisMonthSubscriptions = await Subscription.findAll({
        where: {
          status: 'active',
          start_date: { [Op.gte]: currentMonth }
        },
        attributes: ['amount', 'currency', 'billing_cycle']
      });

      let thisMonthRevenueUSD = 0;
      thisMonthSubscriptions.forEach(sub => {
        const amountUSD = this.convertToUSD(sub.amount, sub.currency);
        let monthlyAmount = amountUSD;
        if (sub.billing_cycle === 'quarterly') {
          monthlyAmount = amountUSD / 3;
        } else if (sub.billing_cycle === 'yearly') {
          monthlyAmount = amountUSD / 12;
        }
        thisMonthRevenueUSD += monthlyAmount;
      });

      // Also add revenue from tenants created this month (based on their plan)
      if (tenantsWithSubscriptions.size > 0) {
        const thisMonthTenants = await Tenant.findAll({
          where: {
            status: 'active',
            created_at: { [Op.gte]: currentMonth },
            id: { [Op.notIn]: Array.from(tenantsWithSubscriptions) }
          },
          attributes: ['id', 'plan_type']
        });

        thisMonthTenants.forEach(tenant => {
          const planPrice = constants.PLAN_PRICES[tenant.plan_type]?.monthly || 0;
          if (planPrice > 0) {
            thisMonthRevenueUSD += planPrice;
          }
        });
      } else {
        // If no subscriptions, calculate from all tenants created this month
        const thisMonthTenants = await Tenant.findAll({
          where: {
            status: 'active',
            created_at: { [Op.gte]: currentMonth }
          },
          attributes: ['id', 'plan_type']
        });

        thisMonthTenants.forEach(tenant => {
          const planPrice = constants.PLAN_PRICES[tenant.plan_type]?.monthly || 0;
          if (planPrice > 0) {
            thisMonthRevenueUSD += planPrice;
          }
        });
      }

      // Get usage statistics
      const totalOrders = await Order.count();
      const totalProducts = await require('../models/Product').count();

      // Calculate tenant growth
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const newTenantsThisMonth = await Tenant.count({
        where: {
          created_at: { [Op.gte]: thisMonthStart }
        }
      });

      const lastMonthStart = new Date(thisMonthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const lastMonthEnd = new Date(thisMonthStart);
      
      const tenantsLastMonth = await Tenant.count({
        where: {
          created_at: { [Op.gte]: lastMonthStart, [Op.lt]: lastMonthEnd }
        }
      });

      const growthRate = tenantsLastMonth > 0 
        ? ((newTenantsThisMonth - tenantsLastMonth) / tenantsLastMonth * 100).toFixed(1)
        : newTenantsThisMonth > 0 ? 100 : 0;

      // Average users per tenant
      const avgUsersPerTenant = totalTenants > 0 ? (totalUsers / totalTenants).toFixed(1) : 0;

      // Plan distribution
      const planDistribution = await Tenant.findAll({
        attributes: [
          'plan_type',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['plan_type'],
        raw: true
      });

      const planCounts = {};
      planDistribution.forEach(p => {
        planCounts[p.plan_type] = parseInt(p.count);
      });

      // Additional usage statistics
      const totalCustomers = await require('../models/Customer').count();
      const totalReceipts = await require('../models/Receipt').count({ where: { status: 'active' } });
      
      // Revenue per tenant (average)
      const avgRevenuePerTenant = activeTenants > 0 
        ? (monthlyRevenueUSD / activeTenants).toFixed(2) 
        : 0;

      // Get system health for uptime calculation
      const { testConnection } = require('../config/database');
      const dbConnected = await testConnection();
      const systemUptime = dbConnected ? 99.9 : 0; // Simplified - can be enhanced with actual uptime tracking

      res.json({
        totalTenants,
        activeTenants,
        totalUsers,
        totalRevenue: parseFloat(totalRevenueUSD.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenueUSD.toFixed(2)),
        thisMonthRevenue: parseFloat(thisMonthRevenueUSD.toFixed(2)),
        activeSubscriptions: activeSubscriptions.length,
        totalOrders,
        totalProducts,
        totalCustomers,
        totalReceipts,
        newTenantsThisMonth,
        growthRate: parseFloat(growthRate),
        avgUsersPerTenant: parseFloat(avgUsersPerTenant),
        avgRevenuePerTenant: parseFloat(avgRevenuePerTenant),
        planDistribution: planCounts,
        systemUptime: parseFloat(systemUptime.toFixed(1)),
        systemHealth: dbConnected ? 'healthy' : 'unhealthy'
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
      const BackupService = require('../services/backupService');
      const result = await BackupService.performBackup(req.user.id);
      
      res.json({ 
        message: 'Backup triggered successfully',
        backup: result
      });
    } catch (error) {
      console.error('Error triggering backup:', error);
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
      const oldSettings = await SystemSettingsService.getSettings();
      const settings = await SystemSettingsService.saveSettings(req.body);
      
      // Restart backup scheduler if backup frequency changed
      if (oldSettings.backupFrequency !== settings.backupFrequency) {
        const backupScheduler = require('../services/backupScheduler');
        await backupScheduler.restart();
      }
      
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

  // Upload avatar
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const superadminId = req.user.id;
      const superadmin = await SuperAdmin.findByPk(superadminId);

      if (!superadmin) {
        return res.status(404).json({ error: 'SuperAdmin not found' });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars/superadmin',
            public_id: `superadmin-${superadminId}`,
            transformation: [
              { width: 200, height: 200, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const oldAvatarUrl = superadmin.avatar_url;
      await superadmin.update({ avatar_url: result.secure_url });

      // Log to system logs
      await SystemLog.create({
        superadmin_id: superadminId,
        action: 'UPDATE_PROFILE_PICTURE',
        description: `SuperAdmin ${superadmin.email} updated profile picture`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({
        message: 'Avatar uploaded successfully',
        avatar_url: result.secure_url
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { SuperAdminController, upload };

