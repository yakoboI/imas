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
      await ReceiptItem.create({
        tenant_id: tenantId,
        receipt_id: receipt.id,
        product_id: orderItem.product_id,
        description: orderItem.product?.name || 'Product',
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

    // Send email if requested
    if (sendEmail && (customerEmail || order.customer?.email)) {
      await this.sendReceiptEmail(receipt, customerEmail || order.customer.email);
    }

    // Reload receipt with items
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
        date: fullReceipt.issue_date ? new Date(fullReceipt.issue_date).toLocaleDateString() : new Date().toLocaleDateString(),
        time: fullReceipt.issue_date ? new Date(fullReceipt.issue_date).toLocaleTimeString() : new Date().toLocaleTimeString(),
        total: fullReceipt.total_amount || 0,
        tax: fullReceipt.tax_amount || 0,
        discount: fullReceipt.discount_amount || 0,
        subtotal: (fullReceipt.total_amount || 0) - (fullReceipt.tax_amount || 0) - (fullReceipt.discount_amount || 0),
        paymentMethod: fullReceipt.payment_method || 'cash'
      },
      company: {
        name: fullReceipt.tenant.name || 'Company',
        address: fullReceipt.tenant.company_address || '',
        phone: fullReceipt.tenant.company_phone || '',
        email: fullReceipt.tenant.company_email || '',
        logo: fullReceipt.tenant.company_logo_url || '',
        taxId: fullReceipt.tenant.tax_id || ''
      },
      customer: fullReceipt.customer ? {
        name: fullReceipt.customer.name || 'Customer',
        email: fullReceipt.customer.email || '',
        phone: fullReceipt.customer.phone || '',
        address: fullReceipt.customer.address || ''
      } : null,
      items: (fullReceipt.items && Array.isArray(fullReceipt.items)) ? fullReceipt.items.map(item => ({
        description: item.description || 'Product',
        quantity: item.quantity || 0,
        unitPrice: item.unit_price || 0,
        subtotal: item.subtotal || 0,
        tax: item.tax_amount || 0
      })) : []
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
    return await Receipt.findOne({
      where: { id: receiptId, tenant_id: tenantId },
      include: [
        { model: ReceiptItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order' },
        { model: Tenant, as: 'tenant' }
      ]
    });
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
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['issue_date', 'DESC']],
      limit,
      offset
    });

    return {
      receipts: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = ReceiptService;

