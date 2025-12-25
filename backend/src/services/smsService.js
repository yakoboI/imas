require('dotenv').config();

class SMSService {
  /**
   * Check if SMS notifications are enabled
   */
  static async areNotificationsEnabled() {
    // Check if Twilio credentials are configured
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  /**
   * Send SMS
   * @param {Object} options
   * @param {string} options.to - Phone number (E.164 format)
   * @param {string} options.message - Message text
   */
  static async sendSMS({ to, message }) {
    try {
      // Check if SMS is enabled
      const enabled = await this.areNotificationsEnabled();
      if (!enabled) {
        return {
          success: true,
          skipped: true,
          message: 'SMS notifications not configured'
        };
      }

      // Validate phone number
      if (!to || !this._isValidPhoneNumber(to)) {
        throw new Error('Invalid phone number format');
      }

      // In development, return success without sending
      if (process.env.NODE_ENV === 'development' && !process.env.TWILIO_SEND_SMS) {
        return {
          success: true,
          messageId: 'dev-mode',
          message: 'SMS logged (development mode)'
        };
      }

      // Use Twilio if available
      if (process.env.TWILIO_ACCOUNT_SID) {
        return await this._sendViaTwilio(to, message);
      }

      // Fallback: return success without sending
      return {
        success: true,
        skipped: true,
        message: 'No SMS provider configured'
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS via Twilio
   */
  static async _sendViaTwilio(to, message) {
    try {
      // Dynamically require Twilio (optional dependency)
      const twilio = require('twilio');
      
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      // If Twilio is not installed, return dev mode response
      if (error.code === 'MODULE_NOT_FOUND') {
        return {
          success: true,
          skipped: true,
          message: 'Twilio not installed'
        };
      }
      throw error;
    }
  }

  /**
   * Validate phone number (basic validation)
   */
  static _isValidPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if it has at least 10 digits
    return digits.length >= 10;
  }

  /**
   * Format phone number to E.164 format
   */
  static formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // If doesn't start with +, assume it needs country code
    if (!phone.startsWith('+')) {
      // Default to +1 (US) if no country code provided
      // In production, you'd want to detect country code
      if (digits.length === 10) {
        digits = '1' + digits;
      }
      return '+' + digits;
    }
    
    return phone;
  }
}

module.exports = SMSService;

