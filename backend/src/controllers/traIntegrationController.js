const Tenant = require('../models/Tenant');
const AuditService = require('../services/auditService');
const TraApiService = require('../services/traApiService');
const { encrypt } = require('../utils/encryption');

class TraIntegrationController {
  /**
   * Get TRA integration configuration for tenant (Admin only)
   * Returns configuration without sensitive data (masked password)
   */
  static async getTraConfiguration(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const tenant = await Tenant.findByPk(tenantId, {
        attributes: {
          exclude: ['cert_password', 'tra_cert_pfx_base64'] // Don't send sensitive data
        }
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Return configuration (password and cert are excluded from response)
      res.json({
        tenantTIN: tenant.tenant_tin || '',
        vfdSerialNum: tenant.vfd_serial_num || '',
        traVerified: tenant.tra_verified || false,
        traVerifiedAt: tenant.tra_verified_at || null,
        lastZReportDate: tenant.last_zreport_date || null,
        currentGlobalCounter: tenant.current_global_counter || 0,
        traApiEndpoint: tenant.tra_api_endpoint || null,
        hasCertificate: !!tenant.tra_cert_pfx_base64, // Just indicate if cert exists
        hasPassword: !!tenant.cert_password // Just indicate if password exists
      });
    } catch (error) {
      console.error('[TraIntegrationController] Error in getTraConfiguration:', error);
      next(error);
    }
  }

  /**
   * Configure TRA integration credentials (Admin only)
   * Accepts TIN, VFD Serial Number, PFX certificate file, and password
   */
  static async configureTraIntegration(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { tin, vfdSerialNum, certPassword, traApiEndpoint } = req.body;
      const certFile = req.file; // PFX certificate file from multer

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      // Validate required fields
      if (!tin || !vfdSerialNum) {
        return res.status(400).json({ 
          error: 'TIN and VFD Serial Number are required' 
        });
      }

      if (!certFile && !req.body.certBase64) {
        return res.status(400).json({ 
          error: 'PFX certificate file or base64 string is required' 
        });
      }

      if (!certPassword) {
        return res.status(400).json({ 
          error: 'Certificate password is required' 
        });
      }

      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Read certificate file and convert to base64
      let certBase64;
      if (certFile) {
        // If file was uploaded via multer
        const fs = require('fs').promises;
        const certBuffer = await fs.readFile(certFile.path);
        certBase64 = certBuffer.toString('base64');
        // Clean up temporary file
        await fs.unlink(certFile.path).catch(() => {}); // Ignore errors
      } else if (req.body.certBase64) {
        // If base64 string was provided directly
        certBase64 = req.body.certBase64;
      }

      // Encrypt the certificate password
      const encryptedPassword = encrypt(certPassword);

      // Store old values for audit trail
      const oldValues = {
        tenant_tin: tenant.tenant_tin,
        vfd_serial_num: tenant.vfd_serial_num,
        tra_verified: tenant.tra_verified,
        tra_api_endpoint: tenant.tra_api_endpoint
      };

      // Update tenant with TRA credentials
      await tenant.update({
        tenant_tin: tin,
        vfd_serial_num: vfdSerialNum,
        tra_cert_pfx_base64: certBase64,
        cert_password: encryptedPassword,
        tra_api_endpoint: traApiEndpoint || null,
        tra_verified: false, // Reset verified status when credentials change
        tra_verified_at: null
      });

      // Attempt to validate credentials with TRA API
      await tenant.reload();
      let validationResult = null;
      try {
        validationResult = await TraApiService.validateCredentials(tenant);
        
        if (validationResult.success) {
          // Try full registration
          const registrationResult = await TraApiService.registerTenant(tenant);
          
          if (registrationResult.success) {
            await tenant.update({
              tra_verified: true,
              tra_verified_at: new Date()
            });
          }
          validationResult = registrationResult;
        }
      } catch (validationError) {
        console.error('TRA validation error:', validationError);
        validationResult = {
          success: false,
          message: validationError.message
        };
      }

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CONFIGURE_TRA_INTEGRATION',
        entity_type: 'Tenant',
        entity_id: tenantId,
        old_values: oldValues,
        new_values: {
          tenant_tin: tenant.tenant_tin,
          vfd_serial_num: tenant.vfd_serial_num,
          tra_verified: tenant.tra_verified,
          tra_api_endpoint: tenant.tra_api_endpoint
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `TRA integration configured by ${req.user.email}. Validation: ${validationResult?.success ? 'Success' : 'Failed'}`
      });

      // Reload tenant to get updated values
      await tenant.reload();

      res.json({
        message: 'TRA integration configured successfully',
        validation: validationResult,
        configuration: {
          tenantTIN: tenant.tenant_tin,
          vfdSerialNum: tenant.vfd_serial_num,
          traVerified: tenant.tra_verified,
          traVerifiedAt: tenant.tra_verified_at,
          traApiEndpoint: tenant.tra_api_endpoint
        }
      });
    } catch (error) {
      console.error('[TraIntegrationController] Error in configureTraIntegration:', error);
      next(error);
    }
  }

  /**
   * Verify/Test TRA credentials (Admin only)
   * Tests the current credentials by attempting to generate a token
   */
  static async verifyCredentials(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      if (!tenant.tenant_tin || !tenant.vfd_serial_num || !tenant.tra_cert_pfx_base64) {
        return res.status(400).json({ 
          error: 'TRA credentials are not configured. Please configure TRA integration first.' 
        });
      }

      // Validate credentials
      const validationResult = await TraApiService.validateCredentials(tenant);
      
      // Try registration if validation succeeds
      if (validationResult.success) {
        const registrationResult = await TraApiService.registerTenant(tenant);
        
        if (registrationResult.success) {
          await tenant.update({
            tra_verified: true,
            tra_verified_at: new Date()
          });
        }
        
        // Log audit trail
        await AuditService.logAction({
          tenant_id: tenantId,
          user_id: req.user.id,
          action: 'VERIFY_TRA_CREDENTIALS',
          entity_type: 'Tenant',
          entity_id: tenantId,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          description: `TRA credentials verified by ${req.user.email}. Result: ${registrationResult.success ? 'Success' : 'Failed'}`
        });

        return res.json({
          success: registrationResult.success,
          message: registrationResult.message,
          verified: registrationResult.success
        });
      } else {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
          verified: false
        });
      }
    } catch (error) {
      console.error('[TraIntegrationController] Error in verifyCredentials:', error);
      next(error);
    }
  }

  /**
   * Remove TRA integration (Admin only)
   * Clears all TRA credentials and resets verification status
   */
  static async removeTraIntegration(req, res, next) {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Store old values for audit trail
      const oldValues = {
        tenant_tin: tenant.tenant_tin,
        vfd_serial_num: tenant.vfd_serial_num,
        tra_verified: tenant.tra_verified
      };

      // Clear TRA credentials
      await tenant.update({
        tenant_tin: null,
        vfd_serial_num: null,
        tra_cert_pfx_base64: null,
        cert_password: null,
        tra_verified: false,
        tra_verified_at: null,
        tra_api_endpoint: null,
        current_global_counter: 0,
        last_zreport_date: null
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'REMOVE_TRA_INTEGRATION',
        entity_type: 'Tenant',
        entity_id: tenantId,
        old_values: oldValues,
        new_values: {
          tenant_tin: null,
          vfd_serial_num: null,
          tra_verified: false
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `TRA integration removed by ${req.user.email}`
      });

      res.json({
        message: 'TRA integration removed successfully'
      });
    } catch (error) {
      console.error('[TraIntegrationController] Error in removeTraIntegration:', error);
      next(error);
    }
  }
}

module.exports = TraIntegrationController;

