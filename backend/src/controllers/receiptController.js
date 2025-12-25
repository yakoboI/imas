const ReceiptService = require('../services/receiptService');
const AuditService = require('../services/auditService');
const fs = require('fs').promises;
const path = require('path');

class ReceiptController {
  // Generate receipt
  static async generateReceipt(req, res, next) {
    try {
      const { orderId, templateType, sendEmail, customerEmail } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user.id;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const receipt = await ReceiptService.generateReceipt(
        orderId,
        tenantId,
        userId,
        { templateType, sendEmail, customerEmail }
      );

      // Log audit
      try {
        await AuditService.logAction({
          tenant_id: tenantId,
          user_id: userId,
          action: 'GENERATE_RECEIPT',
          entity_type: 'Receipt',
          entity_id: receipt.id,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          description: `Receipt ${receipt.receipt_number} generated`
        });
      } catch (auditError) {
        // Don't fail the request if audit logging fails
        console.error('Error logging audit:', auditError);
      }

      res.status(201).json({
        message: 'Receipt generated successfully',
        receipt
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      console.error('Error stack:', error.stack);
      // Pass error to error handler middleware
      next(error);
    }
  }

  // Get receipt by ID
  static async getReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const receipt = await ReceiptService.getReceipt(id, tenantId);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      res.json({ receipt });
    } catch (error) {
      next(error);
    }
  }

  // List receipts
  static async listReceipts(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        customerId: req.query.customerId,
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await ReceiptService.listReceipts(tenantId, filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Download PDF
  static async downloadPDF(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      // Get receipt as Sequelize model instance for updates
      const Receipt = require('../models/Receipt');
      const receiptModel = await Receipt.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!receiptModel) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      const templateType = receiptModel.template_type || 'thermal';

      // Always regenerate PDF to ensure latest template is used
      try {
        // Regenerate PDF with latest template
        const { html, pdfBuffer } = await ReceiptService.generateReceiptDocument(
          receiptModel, // Pass model instance - it has an id property
          templateType
        );
        await receiptModel.update({ html_content: html });
        const pdfUrl = await ReceiptService.uploadPDF(receiptModel.id, pdfBuffer, tenantId);
        await receiptModel.update({ pdf_url: pdfUrl });
        // Reload receipt to get updated pdf_url
        await receiptModel.reload();
      } catch (genError) {
        console.error('Error generating PDF on-demand:', genError);
        console.error('Error stack:', genError.stack);
        return res.status(500).json({ 
          error: 'Failed to generate PDF',
          message: genError.message || 'An error occurred while generating the PDF'
        });
      }

      // In production, serve from S3
      // For now, serve from local file system
      const filepath = path.join(__dirname, '../../', receiptModel.pdf_url);

      try {
        await fs.access(filepath);
        res.download(filepath, `receipt-${receiptModel.receipt_number}.pdf`);
      } catch (fileError) {
        // If file doesn't exist, try to regenerate
        console.error('PDF file not found, attempting to regenerate:', fileError);
        try {
          const { html, pdfBuffer } = await ReceiptService.generateReceiptDocument(
            receiptModel,
            templateType
          );
          await receiptModel.update({ html_content: html });
          const pdfUrl = await ReceiptService.uploadPDF(receiptModel.id, pdfBuffer, tenantId);
          await receiptModel.update({ pdf_url: pdfUrl });
          await receiptModel.reload();
          const newFilepath = path.join(__dirname, '../../', receiptModel.pdf_url);
          await fs.access(newFilepath);
          res.download(newFilepath, `receipt-${receiptModel.receipt_number}.pdf`);
        } catch (regenerateError) {
          console.error('Error regenerating PDF:', regenerateError);
          console.error('Regenerate error stack:', regenerateError.stack);
          res.status(500).json({ 
            error: 'PDF file not found and could not be regenerated',
            message: regenerateError.message || 'An error occurred while regenerating the PDF'
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error in downloadPDF:', error);
      console.error('Error stack:', error.stack);
      next(error);
    }
  }

  // Preview receipt HTML
  static async previewReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const receipt = await ReceiptService.getReceipt(id, tenantId);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      res.send(receipt.html_content || 'Receipt preview not available');
    } catch (error) {
      next(error);
    }
  }

  // Email receipt
  static async emailReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const tenantId = req.tenantId;

      const receipt = await ReceiptService.getReceipt(id, tenantId);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      await ReceiptService.sendReceiptEmail(receipt, email);

      // Log audit
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'EMAIL_RECEIPT',
        entity_type: 'Receipt',
        entity_id: receipt.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Receipt ${receipt.receipt_number} emailed to ${email}`
      });

      res.json({ message: 'Receipt emailed successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Void receipt
  static async voidReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user.id;

      const receipt = await ReceiptService.voidReceipt(id, tenantId, userId, reason);

      // Log audit
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: userId,
        action: 'VOID_RECEIPT',
        entity_type: 'Receipt',
        entity_id: receipt.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Receipt ${receipt.receipt_number} voided: ${reason}`
      });

      res.json({
        message: 'Receipt voided successfully',
        receipt
      });
    } catch (error) {
      next(error);
    }
  }

  // Get receipt audit trail
  static async getReceiptAudit(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const auditLogs = await AuditService.getEntityHistory('Receipt', id, tenantId);

      res.json({ auditLogs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReceiptController;

