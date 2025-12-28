const PasskeyService = require('../services/passkeyService');
const AuditService = require('../services/auditService');

class PasskeyController {
  /**
   * Start passkey registration
   * POST /api/auth/passkey/register
   */
  static async startRegistration(req, res, next) {
    try {
      const userId = req.user.id;

      const options = await PasskeyService.startRegistration(userId);

      res.json({
        options,
        message: 'Registration challenge generated'
      });
    } catch (error) {
      console.error('Start passkey registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Complete passkey registration
   * POST /api/auth/passkey/register/complete
   */
  static async completeRegistration(req, res, next) {
    try {
      const userId = req.user.id;
      const { credential, deviceName } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Credential is required' });
      }

      const result = await PasskeyService.completeRegistration(
        userId,
        credential,
        deviceName
      );

      // Log passkey registration
      await AuditService.logAction({
        tenant_id: req.user.tenantId,
        user_id: userId,
        action: 'PASSKEY_REGISTERED',
        entity_type: 'Passkey',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Passkey registered: ${deviceName || 'Unknown Device'}`
      });

      res.json({
        ...result,
        message: 'Passkey registered successfully'
      });
    } catch (error) {
      console.error('Complete passkey registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Start passkey authentication
   * POST /api/auth/passkey/login
   */
  static async startAuthentication(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const options = await PasskeyService.startAuthentication(email);

      res.json({
        options,
        message: 'Authentication challenge generated'
      });
    } catch (error) {
      console.error('Start passkey authentication error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Complete passkey authentication
   * POST /api/auth/passkey/login/complete
   */
  static async completeAuthentication(req, res, next) {
    try {
      const { email, credential } = req.body;

      if (!email || !credential) {
        return res.status(400).json({ error: 'Email and credential are required' });
      }

      const result = await PasskeyService.completeAuthentication(email, credential);

      // Log passkey login
      await AuditService.logAction({
        tenant_id: result.user.tenantId,
        user_id: result.user.id,
        action: 'LOGIN',
        entity_type: 'User',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'User logged in with passkey'
      });

      res.json(result);
    } catch (error) {
      console.error('Complete passkey authentication error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * Get user's passkeys
   * GET /api/auth/passkeys
   */
  static async getUserPasskeys(req, res, next) {
    try {
      const userId = req.user.id;
      const passkeys = await PasskeyService.getUserPasskeys(userId);

      res.json({ passkeys });
    } catch (error) {
      console.error('Get user passkeys error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a passkey
   * DELETE /api/auth/passkeys/:id
   */
  static async deletePasskey(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await PasskeyService.deletePasskey(userId, id);

      // Log passkey deletion
      await AuditService.logAction({
        tenant_id: req.user.tenantId,
        user_id: userId,
        action: 'PASSKEY_DELETED',
        entity_type: 'Passkey',
        entity_id: id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: 'Passkey deleted'
      });

      res.json(result);
    } catch (error) {
      console.error('Delete passkey error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Check if user has passkeys
   * GET /api/auth/passkeys/check
   */
  static async checkPasskeys(req, res, next) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const User = require('../models/User');
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.json({ hasPasskeys: false });
      }

      const hasPasskeys = await PasskeyService.hasPasskeys(user.id);

      res.json({ hasPasskeys });
    } catch (error) {
      console.error('Check passkeys error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = PasskeyController;

