const { Op } = require('sequelize');
const { AuditLog, SystemLog, User, Tenant } = require('../models/index');

class AuditService {
  // Log an action
  static async logAction(data) {
    try {
      if (data.superadmin_id) {
        return await SystemLog.create({
          superadmin_id: data.superadmin_id,
          action: data.action,
          target_tenant_id: data.target_tenant_id || null,
          description: data.description,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          timestamp: new Date()
        });
      } else {
        return await AuditLog.create({
          tenant_id: data.tenant_id,
          user_id: data.user_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          old_values: data.old_values,
          new_values: data.new_values,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          description: data.description,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error logging audit:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  // Get audit logs for a tenant
  static async getAuditLogs(tenantId, filters = {}) {
    const {
      startDate,
      endDate,
      userId,
      action,
      entityType,
      entityId,
      page = 1,
      limit = 50
    } = filters;

    const where = { tenant_id: tenantId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    if (userId) where.user_id = userId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain'],
          required: false
        }
      ],
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Get global audit logs (SuperAdmin)
  static async getGlobalAuditLogs(filters = {}) {
    const {
      tenantId,
      startDate,
      endDate,
      userId,
      action,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    if (tenantId) where.tenant_id = tenantId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }
    if (userId) where.user_id = userId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain'],
          required: false
        }
      ],
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Get entity history
  static async getEntityHistory(entityType, entityId, tenantId) {
    return await AuditLog.findAll({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        tenant_id: tenantId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
  }

  // Get user activity
  static async getUserActivity(userId, tenantId, limit = 50) {
    return await AuditLog.findAll({
      where: {
        user_id: userId,
        tenant_id: tenantId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name'],
          required: false
        }
      ],
      order: [['timestamp', 'DESC']],
      limit
    });
  }

  // Search audit logs
  static async searchAuditLogs(tenantId, keyword) {
    return await AuditLog.findAll({
      where: {
        tenant_id: tenantId,
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
  }

  // Get audit statistics
  static async getAuditStats(tenantId, startDate, endDate) {
    const where = { tenant_id: tenantId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    const totalLogs = await AuditLog.count({ where });

    // Get unique active users count
    const uniqueUserIdsResult = await AuditLog.findAll({
      where: {
        ...where,
        user_id: { [Op.ne]: null }
      },
      attributes: [
        [require('sequelize').fn('DISTINCT', require('sequelize').col('user_id')), 'user_id']
      ],
      raw: true
    });
    const activeUserIds = uniqueUserIdsResult
      .map(u => u.user_id)
      .filter(id => id !== null && id !== undefined);
    const totalUsers = activeUserIds.length > 0 
      ? await User.count({ 
          where: { 
            id: { [Op.in]: activeUserIds }, 
            status: 'active',
            tenant_id: tenantId
          } 
        })
      : 0;

    const actionCounts = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    const entityTypeCounts = await AuditLog.findAll({
      where,
      attributes: [
        'entity_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['entity_type'],
      raw: true
    });

    // Calculate totals and convert arrays to objects
    const totalActions = actionCounts.length;
    const totalEntityTypes = entityTypeCounts.filter(e => e.entity_type).length;
    
    // Convert actionCounts array to object
    const actionsByType = {};
    actionCounts.forEach(item => {
      if (item.action) {
        actionsByType[item.action] = parseInt(item.count) || 0;
      }
    });

    // Convert entityTypeCounts array to object
    const entityTypesCount = {};
    entityTypeCounts.forEach(item => {
      if (item.entity_type) {
        entityTypesCount[item.entity_type] = parseInt(item.count) || 0;
      }
    });

    return {
      totalLogs,
      totalUsers,
      totalActions,
      totalEntityTypes,
      actionCounts, // Keep for backward compatibility
      entityTypeCounts, // Keep for backward compatibility
      actionsByType,
      entityTypesCount
    };
  }
}

module.exports = AuditService;

