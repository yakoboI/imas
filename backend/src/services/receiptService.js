const { v4: uuidv4 } = require('uuid');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const { generatePDF } = require('../utils/pdfGenerator');
const { getReceiptTemplate } = require('../utils/receiptTemplates');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const TraApiService = require('./traApiService');

class ReceiptService {
  // Generate receipt number
  static generateReceiptNumber(tenantId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP-${year}-${random}`;
  }

  // Generate receipt from order
  static async generateReceipt(orderId, tenantId, userId, options = {}) {
    const {
      templateType = 'thermal',
      sendEmail = false,
      customerEmail = null
    } = options;

    // Fetch order with items
    const order = await Order.findOne({
      where: { id: orderId, tenant_id: tenantId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        { model: Customer, as: 'customer' },
        { model: Tenant, as: 'tenant' }
      ]
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate that order is completed before generating receipt
    if (order.status !== 'completed') {
      throw new Error(`Cannot generate receipt for order with status '${order.status}'. Order must be completed first.`);
    }

    // Check if receipt already exists
    let receipt = await Receipt.findOne({
      where: { order_id: orderId, tenant_id: tenantId }
    });

    // If receipt exists but PDF is missing, regenerate it
    if (receipt && receipt.status === 'active') {
      // Check if PDF exists on disk
      if (!receipt.pdf_url) {
        try {
          // Regenerate PDF for existing receipt
          const { html, pdfBuffer } = await this.generateReceiptDocument(receipt, templateType);
          await receipt.update({ html_content: html });
          const pdfUrl = await this.uploadPDF(receipt.id, pdfBuffer, tenantId);
          await receipt.update({ pdf_url: pdfUrl });
          // Reload receipt with updated PDF URL
          return await Receipt.findOne({
            where: { id: receipt.id },
            include: [
              { model: ReceiptItem, as: 'items' },
              { model: Customer, as: 'customer' },
              { model: Order, as: 'order' }
            ]
          });
        } catch (error) {
          console.error('Error regenerating PDF for existing receipt:', error);
          // If PDF generation fails, still return the receipt but log the error
          // The PDF can be regenerated later via the download endpoint
        }
      }
      return receipt;
    }

    // Generate receipt number
    const receiptNumber = this.generateReceiptNumber(tenantId);

    // Create receipt
    receipt = await Receipt.create({
      tenant_id: tenantId,
      receipt_number: receiptNumber,
      order_id: orderId,
      customer_id: order.customer_id,
      issue_date: new Date(),
      total_amount: order.total_amount,
      tax_amount: order.tax_amount || 0,
      discount_amount: order.discount_amount || 0,
      payment_method: order.payment_method,
      template_type: templateType,
      status: 'active',
      created_by: userId
    });

    // Create receipt items
    for (const orderItem of order.items) {
      const productName = orderItem.product?.name || 'Product';
      const productSku = orderItem.product?.sku || '';
      const description = productSku ? `${productName} (SKU: ${productSku})` : productName;
      
      await ReceiptItem.create({
        tenant_id: tenantId,
        receipt_id: receipt.id,
        product_id: orderItem.product_id,
        description: description,
        quantity: orderItem.quantity,
        unit_price: orderItem.unit_price,
        subtotal: orderItem.subtotal,
        tax_rate: orderItem.tax_rate || 0,
        tax_amount: (orderItem.subtotal * (orderItem.tax_rate || 0)) / 100
      });
    }

    // Generate HTML and PDF
    const { html, pdfBuffer } = await this.generateReceiptDocument(receipt, templateType);

    // Save HTML content
    await receipt.update({ html_content: html });

    // Upload PDF to storage (S3 or local)
    const pdfUrl = await this.uploadPDF(receipt.id, pdfBuffer, tenantId);
    await receipt.update({ pdf_url: pdfUrl });

    // Submit invoice to TRA EFDMS if tenant has TRA integration enabled
    try {
      await this.submitReceiptToTra(receipt, tenantId, order);
      // Reload receipt to get TRA fields after submission
      await receipt.reload();
    } catch (traError) {
      // Log error but don't fail receipt generation
      console.error('Failed to submit receipt to TRA:', traError);
      // Error is already stored in receipt.tra_submission_error by submitReceiptToTra
      // Reload receipt to get error field
      await receipt.reload();
    }

    // Auto-sync to accounting software if integration is active
    try {
      await this.autoSyncToAccounting(receipt, tenantId);
      await receipt.reload(); // Reload to get accounting sync fields
    } catch (accountingError) {
      console.error('Failed to auto-sync receipt to accounting:', accountingError);
      // Don't fail receipt generation if accounting sync fails
      await receipt.reload(); // Still reload to get error field if set
    }

    // Send email if requested
    if (sendEmail && (customerEmail || order.customer?.email)) {
      await this.sendReceiptEmail(receipt, customerEmail || order.customer.email);
    }

    // Reload receipt with items and TRA data
    return await Receipt.findOne({
      where: { id: receipt.id },
      include: [
        { model: ReceiptItem, as: 'items' },
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order' }
      ]
    });
  }

  // Generate receipt document (HTML and PDF)
  static async generateReceiptDocument(receipt, templateType) {
    // Fetch receipt with all related data
    const fullReceipt = await Receipt.findOne({
      where: { id: receipt.id },
      include: [
        {
          model: ReceiptItem,
          as: 'items',
          required: false,
          include: [{ model: Product, as: 'product', required: false }]
        },
        { model: Customer, as: 'customer', required: false },
        { model: Tenant, as: 'tenant', required: false },
        { model: Order, as: 'order', required: false }
      ]
    });

    if (!fullReceipt) {
      throw new Error('Receipt not found');
    }

    if (!fullReceipt.tenant) {
      throw new Error('Tenant information not found for receipt');
    }

    // Get template
    const template = getReceiptTemplate(templateType);

    // Prepare data for template

    const templateData = {
      receipt: {
        number: fullReceipt.receipt_number,
        orderNumber: fullReceipt.order?.order_number || 'N/A',
        date: fullReceipt.issue_date ? new Date(fullReceipt.issue_date).toLocaleDateString() : new Date().toLocaleDateString(),
        time: fullReceipt.issue_date ? new Date(fullReceipt.issue_date).toLocaleTimeString() : new Date().toLocaleTimeString(),
        total: fullReceipt.total_amount || 0,
        tax: fullReceipt.tax_amount || 0,
        discount: fullReceipt.discount_amount || 0,
        subtotal: (fullReceipt.total_amount || 0) - (fullReceipt.tax_amount || 0) - (fullReceipt.discount_amount || 0),
        paymentMethod: fullReceipt.payment_method || 'cash'
      },
      company: {
        name: fullReceipt.tenant.company_name || fullReceipt.tenant.name || 'Company',
        address: fullReceipt.tenant.company_address || null,
        phone: fullReceipt.tenant.company_phone || null,
        email: fullReceipt.tenant.company_email || null,
        logo: fullReceipt.tenant.company_logo_url || null,
        taxId: fullReceipt.tenant.tax_id || null,
        website: fullReceipt.tenant.settings?.website || null
      },
      customer: fullReceipt.customer ? {
        name: fullReceipt.customer.name || 'Customer',
        email: fullReceipt.customer.email || '',
        phone: fullReceipt.customer.phone || '',
        address: fullReceipt.customer.address || ''
      } : { name: 'Walk-in Customer' }, // Always show customer, even if walk-in
      items: (fullReceipt.items && Array.isArray(fullReceipt.items)) ? fullReceipt.items.map(item => {
        // Extract SKU from description if it exists, or get from product
        const productSku = item.product?.sku || '';
        const description = item.description || 'Product';
        return {
          description: description,
          sku: productSku,
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          subtotal: item.subtotal || 0,
          tax: item.tax_amount || 0
        };
      }) : []
    };

    // Compile template
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(templateData);

    // Generate PDF
    const pdfBuffer = await generatePDF(html, templateType);

    return { html, pdfBuffer };
  }

  // Upload PDF to storage
  static async uploadPDF(receiptId, pdfBuffer, tenantId) {
    // In production, upload to S3
    // For now, save locally
    const uploadsDir = path.join(__dirname, '../../uploads/receipts');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${tenantId}-${receiptId}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, pdfBuffer);

    // Return URL (in production, return S3 URL)
    return `/uploads/receipts/${filename}`;
  }

  // Send receipt email
  static async sendReceiptEmail(receipt, email) {
    const emailService = require('./emailService');
    
    const fullReceipt = await Receipt.findOne({
      where: { id: receipt.id },
      include: [
        { model: ReceiptItem, as: 'items' },
        { model: Customer, as: 'customer' },
        { model: Tenant, as: 'tenant' }
      ]
    });

    const emailTemplate = getReceiptTemplate('email');
    const compiledTemplate = handlebars.compile(emailTemplate);
    const html = compiledTemplate({
      receipt: fullReceipt,
      company: fullReceipt.tenant
    });

    await emailService.sendEmail({
      to: email,
      subject: `Receipt ${fullReceipt.receipt_number} from ${fullReceipt.tenant.name}`,
      html,
      attachments: fullReceipt.pdf_url ? [{
        filename: `receipt-${fullReceipt.receipt_number}.pdf`,
        path: fullReceipt.pdf_url
      }] : []
    });
  }

  // Void receipt
  static async voidReceipt(receiptId, tenantId, userId, reason) {
    const receipt = await Receipt.findOne({
      where: { id: receiptId, tenant_id: tenantId }
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status === 'voided') {
      throw new Error('Receipt is already voided');
    }

    await receipt.update({
      status: 'voided',
      voided_at: new Date(),
      voided_by: userId,
      void_reason: reason
    });

    return receipt;
  }

  // Get receipt by ID
  static async getReceipt(receiptId, tenantId) {
    const receipt = await Receipt.findOne({
      where: { id: receiptId, tenant_id: tenantId },
      include: [
        { model: ReceiptItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order' },
        { model: Tenant, as: 'tenant' }
      ]
    });

    if (!receipt) {
      return null;
    }

    // Map receipt to include flat fields for frontend compatibility
    const receiptData = receipt.toJSON ? receipt.toJSON() : receipt;
    return {
      ...receiptData,
      order_number: receiptData.order?.order_number || null,
      customer_name: receiptData.customer?.name || 'Walk-in Customer',
      order_id: receiptData.order_id || receiptData.order?.id || null
    };
  }

  /**
   * Submit receipt/invoice to TRA EFDMS
   * This is called automatically when a receipt is generated (if tenant has TRA integration enabled)
   */
  static async submitReceiptToTra(receipt, tenantId, order) {
    try {
      // Reload receipt with items for TRA submission
      const fullReceipt = await Receipt.findOne({
        where: { id: receipt.id },
        include: [
          { model: ReceiptItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Customer, as: 'customer' },
          { model: Tenant, as: 'tenant' }
        ]
      });

      if (!fullReceipt) {
        throw new Error('Receipt not found');
      }

      const tenant = fullReceipt.tenant;

      // Check if tenant has TRA integration enabled and verified
      if (!tenant.tra_verified || !tenant.tenant_tin || !tenant.vfd_serial_num) {
        // TRA not configured or not verified - skip submission
        return;
      }

      // Prepare invoice data for TRA submission
      const invoiceData = {
        items: fullReceipt.items.map(item => ({
          description: item.description,
          name: item.product?.name || item.description,
          code: item.product?.sku || '',
          sku: item.product?.sku || '',
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal),
          taxRate: parseFloat(item.tax_rate || 0),
          discount: 0 // Add discount support if needed
        })),
        subtotal: parseFloat(fullReceipt.total_amount) - parseFloat(fullReceipt.tax_amount || 0) - parseFloat(fullReceipt.discount_amount || 0),
        tax: parseFloat(fullReceipt.tax_amount || 0),
        discount: parseFloat(fullReceipt.discount_amount || 0),
        total: parseFloat(fullReceipt.total_amount),
        paymentMethod: fullReceipt.payment_method || 'cash',
        customerName: fullReceipt.customer?.name || 'Walk-in Customer',
        customerTin: fullReceipt.customer?.tax_id || ''
      };

      // Submit to TRA API
      const traResponse = await TraApiService.submitInvoice(tenant, invoiceData);

      if (traResponse.success) {
        // Update receipt with TRA response data
        await fullReceipt.update({
          tra_receipt_number: traResponse.receiptNumber,
          tra_qr_code: traResponse.qrCode,
          tra_fiscal_code: traResponse.fiscalCode,
          tra_submitted: true,
          tra_submitted_at: new Date(),
          tra_submission_error: null
        });

        console.log(`Receipt ${fullReceipt.receipt_number} submitted to TRA successfully. TRA Receipt: ${traResponse.receiptNumber}`);
      } else {
        throw new Error(traResponse.message || 'Failed to submit to TRA');
      }
    } catch (error) {
      // Store error in receipt but don't throw (to allow receipt generation to complete)
      await receipt.update({
        tra_submitted: false,
        tra_submission_error: error.message
      });

      // Re-throw so caller can handle if needed
      throw error;
    }
  }

  // List receipts
  static async listReceipts(tenantId, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      status,
      page = 1,
      limit = 50
    } = filters;

    const { Op } = require('sequelize');
    const where = { tenant_id: tenantId };

    if (startDate || endDate) {
      where.issue_date = {};
      if (startDate) where.issue_date[Op.gte] = new Date(startDate);
      if (endDate) where.issue_date[Op.lte] = new Date(endDate);
    }

    if (customerId) where.customer_id = customerId;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Receipt.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'], required: false },
        { model: Order, as: 'order', attributes: ['id', 'order_number'], required: false }
      ],
      order: [['issue_date', 'DESC']],
      limit,
      offset
    });

    // Map receipts to include flat fields for frontend compatibility
    const mappedReceipts = rows.map(receipt => {
      const receiptData = receipt.toJSON ? receipt.toJSON() : receipt;
      return {
        ...receiptData,
        order_number: receiptData.order?.order_number || null,
        customer_name: receiptData.customer?.name || 'Walk-in Customer',
        order_id: receiptData.order_id || receiptData.order?.id || null
      };
    });

    return {
      receipts: mappedReceipts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Auto-sync receipt to accounting software if integration is active
   */
  static async autoSyncToAccounting(receipt, tenantId) {
    try {
      const IntegrationService = require('./integrations/integrationService');

      // Check which accounting integrations are active
      const quickbooksActive = await IntegrationService.isIntegrationActive(tenantId, 'quickbooks');
      const xeroActive = await IntegrationService.isIntegrationActive(tenantId, 'xero');

      // Skip if receipt already synced
      if (receipt.synced_to_accounting) {
        return;
      }

      // Prefer QuickBooks if both are active (or implement preference logic)
      if (quickbooksActive) {
        try {
          await this.syncReceiptToQuickBooks(receipt, tenantId);
          return;
        } catch (qbError) {
          console.error('QuickBooks sync failed, trying Xero:', qbError);
          // Try Xero if QuickBooks fails
        }
      }

      if (xeroActive) {
        try {
          await this.syncReceiptToXero(receipt, tenantId);
        } catch (xeroError) {
          console.error('Xero sync failed:', xeroError);
          throw xeroError;
        }
      }
    } catch (error) {
      console.error('[ReceiptService] Error in autoSyncToAccounting:', error);
      throw error;
    }
  }

  /**
   * Sync receipt to QuickBooks
   */
  static async syncReceiptToQuickBooks(receipt, tenantId) {
    const QuickBooksService = require('./integrations/quickbooksService');

    // Get receipt with items
    const receiptWithItems = await receipt.reload({
      include: [
        { model: ReceiptItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' }
      ]
    });

    // Map receipt to QuickBooks invoice format
    const invoiceData = {
      invoiceNumber: receiptWithItems.receipt_number,
      customerEmail: receiptWithItems.customer?.email || '',
      dueDate: receiptWithItems.issue_date.toISOString().split('T')[0],
      items: receiptWithItems.items.map(item => ({
        name: item.product?.name || 'Item',
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        amount: parseFloat(item.subtotal),
        description: item.product?.name || ''
      }))
    };

    // Create invoice in QuickBooks
    const qbResponse = await QuickBooksService.createInvoice(tenantId, invoiceData);

    // Update receipt with accounting sync info
    await receipt.update({
      synced_to_accounting: true,
      accounting_invoice_id: qbResponse.invoiceId,
      accounting_synced_at: new Date(),
      accounting_provider: 'quickbooks',
      accounting_sync_error: null
    });

    return qbResponse;
  }

  /**
   * Sync receipt to Xero
   */
  static async syncReceiptToXero(receipt, tenantId) {
    const XeroService = require('./integrations/xeroService');

    // Get receipt with items
    const receiptWithItems = await receipt.reload({
      include: [
        { model: ReceiptItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' }
      ]
    });

    // Map receipt to Xero invoice format
    const invoiceData = {
      invoiceNumber: receiptWithItems.receipt_number,
      customerEmail: receiptWithItems.customer?.email || '',
      invoiceDate: receiptWithItems.issue_date.toISOString().split('T')[0],
      dueDate: receiptWithItems.issue_date.toISOString().split('T')[0],
      items: receiptWithItems.items.map(item => ({
        name: item.product?.name || 'Item',
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        amount: parseFloat(item.subtotal),
        description: item.product?.name || ''
      }))
    };

    // Create invoice in Xero
    const xeroResponse = await XeroService.createInvoice(tenantId, invoiceData);

    // Update receipt with accounting sync info
    await receipt.update({
      synced_to_accounting: true,
      accounting_invoice_id: xeroResponse.invoiceId,
      accounting_synced_at: new Date(),
      accounting_provider: 'xero',
      accounting_sync_error: null
    });

    return xeroResponse;
  }
}

module.exports = ReceiptService;

