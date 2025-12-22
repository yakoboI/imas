const AuditService = require('../services/auditService');

class AuditController {
  // Get audit logs
  static async getAuditLogs(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userId: req.query.userId,
        action: req.query.action,
        entityType: req.query.entityType,
        entityId: req.query.entityId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await AuditService.getAuditLogs(tenantId, filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get audit log by ID
  static async getAuditLogById(req, res, next) {
    try {
      const { id } = req.params;
      const AuditLog = require('../models/AuditLog');

      const log = await AuditLog.findByPk(id, {
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ]
      });

      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      res.json({ log });
    } catch (error) {
      next(error);
    }
  }

  // Get entity history
  static async getEntityHistory(req, res, next) {
    try {
      const { type, id } = req.params;
      const tenantId = req.tenantId;

      const history = await AuditService.getEntityHistory(type, id, tenantId);

      res.json({ history });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity
  static async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const tenantId = req.tenantId;

      const activity = await AuditService.getUserActivity(userId, tenantId);

      res.json({ activity });
    } catch (error) {
      next(error);
    }
  }

  // Search audit logs
  static async searchAuditLogs(req, res, next) {
    try {
      const { keyword } = req.query;
      const tenantId = req.tenantId;

      if (!keyword) {
        return res.status(400).json({ error: 'Search keyword is required' });
      }

      const logs = await AuditService.searchAuditLogs(tenantId, keyword);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Export audit logs
  static async exportAuditLogs(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const filters = {
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        userId: req.body.userId,
        action: req.body.action,
        entityType: req.body.entityType
      };

      const { logs } = await AuditService.getAuditLogs(tenantId, { ...filters, limit: 10000 });

      // Convert to CSV (simplified)
      const csv = [
        'Timestamp,User,Action,Entity Type,Entity ID,Description',
        ...logs.map(log => [
          log.timestamp,
          log.user?.email || 'N/A',
          log.action,
          log.entity_type,
          log.entity_id || 'N/A',
          log.description || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  // Get audit statistics
  static async getAuditStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const stats = await AuditService.getAuditStats(tenantId, startDate, endDate);

      res.json({ stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuditController;

