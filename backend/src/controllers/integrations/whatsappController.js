const WhatsAppService = require('../../services/integrations/whatsappService');
const IntegrationService = require('../../services/integrations/integrationService');
const AuditService = require('../../services/auditService');

/**
 * WhatsApp Integration Controller
 */
class WhatsAppController {
  /**
   * Connect/Configure WhatsApp integration
   */
  static async connectWhatsApp(req, res, next) {
    try {
      const { accessToken, phoneNumberId } = req.body;
      const tenantId = req.tenantId;

      if (!accessToken || !phoneNumberId) {
        return res.status(400).json({ error: 'Access token and phone number ID are required' });
      }

      // Validate credentials
      const validationResult = await WhatsAppService.validateCredentials({
        accessToken,
        phoneNumberId
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Save integration
      const integration = await IntegrationService.saveIntegration(
        tenantId,
        WhatsAppService.getIntegrationType(),
        {
          accessToken,
          phoneNumberId
        },
        {
          phoneNumberData: validationResult.phoneNumberData
        },
        true // Verified if validation passed
      );

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONNECT_WHATSAPP',
        entity_type: 'Integration',
        entity_id: integration.id,
        new_values: {
          integration_type: 'whatsapp',
          verified: true,
          status: integration.status
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'WhatsApp integration connected and verified'
      });

      res.json({
        message: 'WhatsApp integration connected and verified successfully',
        verified: true,
        integration: {
          id: integration.id,
          type: integration.integration_type,
          status: integration.status,
          verified: integration.verified
        }
      });
    } catch (error) {
      console.error('[WhatsAppController] Error in connectWhatsApp:', error);
      next(error);
    }
  }

  /**
   * Send WhatsApp message
   */
  static async sendMessage(req, res, next) {
    try {
      const { to, message } = req.body;
      const tenantId = req.tenantId;

      if (!to || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      // Check if WhatsApp is active
      const isActive = await IntegrationService.isIntegrationActive(tenantId, WhatsAppService.getIntegrationType());
      if (!isActive) {
        return res.status(400).json({ error: 'WhatsApp integration is not active. Please configure it first.' });
      }

      // Send message
      const result = await WhatsAppService.sendMessage(tenantId, to, message);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'SEND_WHATSAPP_MESSAGE',
        entity_type: 'Integration',
        entity_id: null,
        new_values: {
          to,
          messageId: result.messageId
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `WhatsApp message sent to ${to}`
      });

      res.json({
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId,
        data: result.data
      });
    } catch (error) {
      console.error('[WhatsAppController] Error in sendMessage:', error);
      next(error);
    }
  }
}

module.exports = WhatsAppController;

