const nodemailer = require('nodemailer');
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
  // Send email
  static async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
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

  // Send password reset email
  static async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html
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

