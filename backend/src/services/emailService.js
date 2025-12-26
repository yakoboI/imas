const nodemailer = require('nodemailer');
const SystemSettingsService = require('./systemSettingsService');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

class EmailService {
  // Check if email notifications are enabled
  static async areNotificationsEnabled() {
    try {
      const settings = await SystemSettingsService.getSettings();
      return settings.emailNotifications !== false; // Default to true if not set
    } catch (error) {
      console.error('Error checking email notifications setting:', error);
      return true; // Default to enabled on error
    }
  }

  // Send email (checks notification settings unless forceSend is true)
  static async sendEmail({ to, subject, html, text, attachments = [], forceSend = false }) {
    try {
      // Check if notifications are enabled (unless forceSend is true for critical emails)
      if (!forceSend) {
        const notificationsEnabled = await this.areNotificationsEnabled();
        if (!notificationsEnabled) {
          console.log(`Email notifications disabled. Skipping email to ${to}: ${subject}`);
          return {
            success: true,
            skipped: true,
            message: 'Email notifications are disabled'
          };
        }
      }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text,
        attachments
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send receipt email
  static async sendReceiptEmail(receipt, customerEmail) {
    // This is handled by receiptService
    // But can be called directly if needed
    return await this.sendEmail({
      to: customerEmail,
      subject: `Receipt ${receipt.receipt_number}`,
      html: receipt.html_content || 'Your receipt is attached.',
      attachments: receipt.pdf_url ? [{
        filename: `receipt-${receipt.receipt_number}.pdf`,
        path: receipt.pdf_url
      }] : []
    });
  }

  // Send password reset email (forceSend = true for critical security emails)
  static async sendPasswordResetEmail(email, resetToken, name = 'User') {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your IMAS account. Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>For security reasons, never share this link with anyone.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from IMAS - Inventory Management System</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - IMAS',
      html,
      forceSend: true // Always send password reset emails (security critical)
    });
  }

  // Send welcome email
  static async sendWelcomeEmail(email, name) {
    const html = `
      <h2>Welcome to Inventory System!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully. You can now log in and start managing your inventory.</p>
      <p>Thank you for joining us!</p>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Inventory System',
      html
    });
  }
}

module.exports = EmailService;

