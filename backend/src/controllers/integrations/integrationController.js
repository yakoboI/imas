const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');
const IntegrationLog = require('../../models/IntegrationLog');

/**
 * Integration Controller
 * Unified controller for managing all integrations
 */
class IntegrationController {
  /**
   * Get all available integrations with metadata
   */
  static async getAvailableIntegrations(req, res, next) {
    try {
      const integrations = IntegrationService.getAvailableIntegrations();
      
      // Get tenant's current integrations to show connection status
      const tenantIntegrations = await IntegrationService.getAllIntegrations(req.tenantId);
      const integrationMap = {};
      tenantIntegrations.forEach(integration => {
        integrationMap[integration.integration_type] = {
          status: integration.status,
          verified: integration.verified,
          verifiedAt: integration.verified_at,
          lastSyncAt: integration.last_sync_at
        };
      });

      // Merge metadata with tenant's integration status
      const result = integrations.map(integration => ({
        ...integration,
        connected: !!integrationMap[integration.type],
        connectionStatus: integrationMap[integration.type] || null
      }));

      res.json({
        integrations: result
      });
    } catch (error) {
      console.error('[IntegrationController] Error in getAvailableIntegrations:', error);
      next(error);
    }
  }

  /**
   * Get all integrations for tenant
   */
  static async getIntegrations(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const integrations = await IntegrationService.getAllIntegrations(tenantId);

      // Remove sensitive credentials from response
      const safeIntegrations = integrations.map(integration => {
        const data = integration.toJSON();
        // Don't send credentials, just indicate if they exist
        const hasCredentials = Object.keys(data.credentials || {}).length > 0;
        return {
          ...data,
          credentials: hasCredentials ? { _exists: true } : {},
          // Include metadata
          metadata: IntegrationService.INTEGRATION_METADATA[data.integration_type] || null
        };
      });

      res.json({
        integrations: safeIntegrations
      });
    } catch (error) {
      console.error('[IntegrationController] Error in getIntegrations:', error);
      next(error);
    }
  }

  /**
   * Get specific integration
   */
  static async getIntegration(req, res, next) {
    try {
      const { type } = req.params;
      const tenantId = req.tenantId;

      if (!IntegrationService.INTEGRATION_TYPES[type.toUpperCase()] && !Object.values(IntegrationService.INTEGRATION_TYPES).includes(type)) {
        return res.status(400).json({ error: 'Invalid integration type' });
      }

      const integration = await IntegrationService.getIntegration(tenantId, type);

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      // Don't send credentials, just metadata
      const data = integration.toJSON();
      const hasCredentials = Object.keys(data.credentials || {}).length > 0;

      res.json({
        integration: {
          ...data,
          credentials: hasCredentials ? { _exists: true } : {},
          metadata: IntegrationService.INTEGRATION_METADATA[type] || null
        }
      });
    } catch (error) {
      console.error('[IntegrationController] Error in getIntegration:', error);
      next(error);
    }
  }

  /**
   * Get integration status
   */
  static async getIntegrationStatus(req, res, next) {
    try {
      const { type } = req.params;
      const tenantId = req.tenantId;

      const isActive = await IntegrationService.isIntegrationActive(tenantId, type);
      const integration = await IntegrationService.getIntegration(tenantId, type);

      res.json({
        type,
        active: isActive,
        status: integration?.status || 'not_configured',
        verified: integration?.verified || false,
        verifiedAt: integration?.verified_at || null,
        lastSyncAt: integration?.last_sync_at || null,
        lastError: integration?.last_error || null
      });
    } catch (error) {
      console.error('[IntegrationController] Error in getIntegrationStatus:', error);
      next(error);
    }
  }

  /**
   * Connect/Configure integration
   * This is a generic endpoint - specific integrations will have their own connect endpoints
   * that handle OAuth flows or credential validation
   */
  static async connectIntegration(req, res, next) {
    try {
      const { type } = req.params;
      const { credentials, configuration } = req.body;
      const tenantId = req.tenantId;

      if (!IntegrationService.INTEGRATION_TYPES[type.toUpperCase()] && !Object.values(IntegrationService.INTEGRATION_TYPES).includes(type)) {
        return res.status(400).json({ error: 'Invalid integration type' });
      }

      // Basic validation - specific integrations should override this
      if (!credentials || typeof credentials !== 'object') {
        return res.status(400).json({ error: 'Credentials are required' });
      }

      // Save integration (not verified yet - should be verified by specific integration service)
      const integration = await IntegrationService.saveIntegration(
        tenantId,
        type,
        credentials,
        configuration || {},
        false // Not verified yet
      );

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_INTEGRATION',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: type,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Connected ${type} integration`
      });

      res.json({
        message: 'Integration connected successfully. Please verify credentials.',
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[IntegrationController] Error in connectIntegration:', error);
      next(error);
    }
  }

  /**
   * Disconnect integration
   */
  static async disconnectIntegration(req, res, next) {
    try {
      const { type } = req.params;
      const tenantId = req.tenantId;

      const integration = await IntegrationService.getIntegration(tenantId, type);

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      // Log audit trail before deletion
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DISCONNECT_INTEGRATION',
        entity_type: 'Integration',
        entity_id: integration.id,
        old_values: {
          integration_type: integration.integration_type,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Disconnected ${type} integration`
      });

      await IntegrationService.deleteIntegration(tenantId, type);

      res.json({
        message: 'Integration disconnected successfully'
      });
    } catch (error) {
      console.error('[IntegrationController] Error in disconnectIntegration:', error);
      next(error);
    }
  }

  /**
   * Get integration logs
   */
  static async getIntegrationLogs(req, res, next) {
    try {
      const { type } = req.params;
      const tenantId = req.tenantId;
      const { 
        limit = 100, 
        offset = 0, 
        status, 
        direction, 
        eventType,
        startDate,
        endDate
      } = req.query;

      // Build query
      const where = {
        tenant_id: tenantId
      };

      if (type && type !== 'all') {
        where.integration_type = type;
      }

      if (status) {
        where.status = status;
      }

      if (direction) {
        where.direction = direction;
      }

      if (eventType) {
        where.event_type = eventType;
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[require('sequelize').Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.created_at[require('sequelize').Op.lte] = new Date(endDate);
        }
      }

      // Get logs
      const { count, rows: logs } = await IntegrationLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        logs: logs.map(log => log.toJSON()),
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('[IntegrationController] Error in getIntegrationLogs:', error);
      next(error);
    }
  }
}

module.exports = IntegrationController;

