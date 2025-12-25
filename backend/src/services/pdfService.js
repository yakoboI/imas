const { generatePDF } = require('../utils/pdfGenerator');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { StockSession, Tenant, User, Receipt, ReceiptItem, Customer } = require('../models/index');
const { Op } = require('sequelize');

class PDFService {
  // Generate daily report PDF (removed - collections feature removed)
  static async generateDailyReport(sessionId, tenantId) {
    const session = await StockSession.findOne({
      where: { id: sessionId, tenant_id: tenantId },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'company_name', 'company_address', 'company_phone', 'company_email', 'name']
        }
      ]
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get all session data (collections service removed - using fallback)
    const sessionData = {
      session: {
        ...session.toJSON(),
        receipts: [],
        adjustments: [],
        subSessions: [],
        currentStock: session.closing_stock_snapshot || session.opening_stock_snapshot || [],
        currentMetrics: {
          totalRevenue: parseFloat(session.total_revenue || 0),
          totalReceipts: session.total_receipts || 0,
          valueOfGoodsSold: 0,
          remainingStockValue: parseFloat(session.closing_stock_value || 0),
          openingStockValue: parseFloat(session.opening_stock_value || 0)
        }
      }
    };
    
    // Prepare report data
    const reportData = await this.prepareReportData(sessionData);

    // Generate HTML
    const html = this.generateReportHTML(reportData);

    // Generate PDF
    const pdfBuffer = await generatePDF(html, 'a4');

    // Save PDF to disk
    const reportsDir = path.join(__dirname, '../../reports/daily', tenantId);
    await fs.mkdir(reportsDir, { recursive: true });
    
    const dateStr = session.date;
    const filename = `${dateStr}.pdf`;
    const filePath = path.join(reportsDir, filename);
    
    await fs.writeFile(filePath, pdfBuffer);

    // Update session with PDF path
    session.pdf_report_path = `/reports/daily/${tenantId}/${filename}`;
    await session.save();

    return session.pdf_report_path;
  }

  // Prepare report data
  static async prepareReportData(sessionData) {
    const { session, currentStock } = sessionData;
    const receipts = session.receipts || [];
    const adjustments = session.adjustments || [];
    const subSessions = session.subSessions || [];

    // Calculate hourly breakdown
    const hourlyBreakdown = this.calculateHourlyBreakdown(receipts);

    // Product sales breakdown
    const productSales = this.calculateProductSales(receipts);

    return {
      company: {
        name: session.tenant?.company_name || session.tenant?.name || 'Company',
        address: session.tenant?.company_address || '',
        phone: session.tenant?.company_phone || '',
        email: session.tenant?.company_email || ''
      },
      session: {
        date: session.date,
        openingTime: session.opening_time,
        closingTime: session.closing_time || '23:59:59',
        status: session.status,
        autoOpened: session.auto_opened,
        autoClosed: session.auto_closed
      },
      openingStock: session.opening_stock_snapshot || [],
      closingStock: currentStock || [],
      metrics: {
        openingStockValue: parseFloat(session.opening_stock_value || 0),
        closingStockValue: parseFloat(session.closing_stock_value || 0),
        totalRevenue: parseFloat(session.total_revenue || 0),
        totalReceipts: session.total_receipts || 0,
        valueOfGoodsSold: session.currentMetrics?.valueOfGoodsSold || 0,
        variance: (parseFloat(session.closing_stock_value || 0)) - 
                  (parseFloat(session.opening_stock_value || 0) - (session.currentMetrics?.valueOfGoodsSold || 0))
      },
      receipts: receipts.map(r => ({
        receiptNumber: r.receipt_number,
        customerName: r.customer_name || r.customer?.name || 'Walk-in Customer',
        timestamp: r.timestamp || r.issue_date,
        totalAmount: parseFloat(r.total_amount || 0),
        items: (r.items || []).map(item => ({
          productName: item.product_name || item.description,
          sku: item.product_sku || item.product?.sku || '',
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price || 0),
          subtotal: parseFloat(item.subtotal || 0)
        }))
      })),
      adjustments: adjustments.map(a => ({
        timestamp: a.timestamp,
        productName: a.product?.name || 'Unknown',
        sku: a.product?.sku || '',
        oldQuantity: a.old_quantity,
        newQuantity: a.new_quantity,
        adjustmentType: a.adjustment_type,
        adjustedBy: a.adjustedBy ? `${a.adjustedBy.first_name || ''} ${a.adjustedBy.last_name || ''}`.trim() : 'System',
        notes: a.notes
      })),
      subSessions: subSessions.map(ss => ({
        openedAt: ss.opened_at,
        closedAt: ss.closed_at,
        openedBy: ss.openedBy ? `${ss.openedBy.first_name || ''} ${ss.openedBy.last_name || ''}`.trim() : 'System'
      })),
      hourlyBreakdown,
      productSales,
      generatedAt: new Date().toISOString(),
      reportId: session.id
    };
  }

  // Calculate hourly breakdown
  static calculateHourlyBreakdown(receipts) {
    const hourly = {};
    receipts.forEach(receipt => {
      const timestamp = receipt.timestamp || receipt.issue_date;
      if (!timestamp) return;
      const hour = new Date(timestamp).getHours();
      const hourKey = `${hour}:00`;
      if (!hourly[hourKey]) {
        hourly[hourKey] = { count: 0, revenue: 0 };
      }
      hourly[hourKey].count++;
      hourly[hourKey].revenue += parseFloat(receipt.total_amount || receipt.totalAmount || 0);
    });
    return hourly;
  }

  // Calculate product sales
  static calculateProductSales(receipts) {
    const productMap = {};
    receipts.forEach(receipt => {
      const items = receipt.items || [];
      items.forEach(item => {
        const productName = item.product_name || item.description || 'Unknown';
        const sku = item.product_sku || item.product?.sku || '';
        const key = `${productName}_${sku}`;
        if (!productMap[key]) {
          productMap[key] = {
            productName: productName,
            sku: sku,
            quantity: 0,
            revenue: 0
          };
        }
        productMap[key].quantity += parseInt(item.quantity || 0);
        productMap[key].revenue += parseFloat(item.subtotal || 0);
      });
    });
    return Object.values(productMap);
  }

  // Generate report HTML
  static generateReportHTML(data) {
    const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daily Collections Report - ${data.session.date}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 20px;
      margin: 10px 0;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      background-color: #f0f0f0;
      padding: 10px;
      margin-bottom: 15px;
      border-left: 4px solid #1976d2;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .summary-box {
      background-color: #f9f9f9;
      border: 2px solid #ddd;
      padding: 15px;
      margin: 20px 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .summary-label {
      font-weight: bold;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .highlight {
      background-color: #fff3cd;
      padding: 2px 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
    {{#if company.address}}<div>{{company.address}}</div>{{/if}}
    {{#if company.phone}}<div>Phone: {{company.phone}}</div>{{/if}}
    {{#if company.email}}<div>Email: {{company.email}}</div>{{/if}}
    <div class="report-title">DAILY COLLECTIONS REPORT</div>
    <div>Date: {{formatDate session.date}}</div>
    <div>Session Period: {{session.openingTime}} - {{session.closingTime}}</div>
  </div>

  <div class="section">
    <div class="section-title">OPENING STOCK (as of {{session.openingTime}})</div>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total Value</th>
        </tr>
      </thead>
      <tbody>
        {{#each openingStock}}
        <tr>
          <td>{{product_name}}</td>
          <td>{{sku}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency price}}</td>
          <td>{{formatCurrency (multiply price quantity)}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align: right; font-weight: bold;">Total Opening Stock Value:</td>
          <td style="font-weight: bold;">{{formatCurrency metrics.openingStockValue}}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="section">
    <div class="section-title">SALES SUMMARY</div>
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Total Receipts:</span>
        <span>{{metrics.totalReceipts}} (Range: 0001 - {{padNumber metrics.totalReceipts 4}})</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Revenue Collected:</span>
        <span>{{formatCurrency metrics.totalRevenue}}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Value of Goods Sold:</span>
        <span>{{formatCurrency metrics.valueOfGoodsSold}}</span>
      </div>
    </div>
  </div>

  {{#if productSales.length}}
  <div class="section">
    <div class="section-title">PRODUCT SALES BREAKDOWN</div>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Quantity Sold</th>
          <th>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {{#each productSales}}
        <tr>
          <td>{{productName}}</td>
          <td>{{sku}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency revenue}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  {{#if adjustments.length}}
  <div class="section">
    <div class="section-title">STOCK ADJUSTMENTS</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Product</th>
          <th>SKU</th>
          <th>Old Qty</th>
          <th>New Qty</th>
          <th>Type</th>
          <th>Adjusted By</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {{#each adjustments}}
        <tr>
          <td>{{formatDateTime timestamp}}</td>
          <td>{{productName}}</td>
          <td>{{sku}}</td>
          <td>{{oldQuantity}}</td>
          <td>{{newQuantity}}</td>
          <td>{{adjustmentType}}</td>
          <td>{{adjustedBy}}</td>
          <td>{{notes}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <div class="section">
    <div class="section-title">CLOSING STOCK (as of {{session.closingTime}})</div>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total Value</th>
        </tr>
      </thead>
      <tbody>
        {{#each closingStock}}
        <tr>
          <td>{{product_name}}</td>
          <td>{{sku}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency price}}</td>
          <td>{{formatCurrency (multiply price quantity)}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align: right; font-weight: bold;">Total Closing Stock Value:</td>
          <td style="font-weight: bold;">{{formatCurrency metrics.closingStockValue}}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="section">
    <div class="section-title">FINANCIAL SUMMARY</div>
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Opening Stock Value:</span>
        <span>{{formatCurrency metrics.openingStockValue}}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Money Collected:</span>
        <span>{{formatCurrency metrics.totalRevenue}}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Value of Goods Sold:</span>
        <span>{{formatCurrency metrics.valueOfGoodsSold}}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Closing Stock Value:</span>
        <span>{{formatCurrency metrics.closingStockValue}}</span>
      </div>
      <div class="summary-row" style="border-top: 2px solid #333; margin-top: 10px; padding-top: 10px;">
        <span class="summary-label">Expected vs Actual Variance:</span>
        <span class="highlight">{{formatCurrency metrics.variance}}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">COMPLETE RECEIPT LOG</div>
    <table>
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Customer</th>
          <th>Timestamp</th>
          <th>Items</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>
        {{#each receipts}}
        <tr>
          <td>{{receiptNumber}}</td>
          <td>{{customerName}}</td>
          <td>{{formatDateTime timestamp}}</td>
          <td>
            {{#each items}}
            {{productName}} ({{quantity}}x){{#unless @last}}, {{/unless}}
            {{/each}}
          </td>
          <td>{{formatCurrency totalAmount}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>Report Generated: {{formatDateTime generatedAt}}</div>
    <div>Report ID: {{reportId}}</div>
    <div>{{company.name}} - Daily Collections Report</div>
  </div>
</body>
</html>
    `;

    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    });

    handlebars.registerHelper('formatDateTime', (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('en-US');
    });

    handlebars.registerHelper('formatCurrency', (amount) => {
      if (amount === null || amount === undefined) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    handlebars.registerHelper('multiply', (a, b) => {
      return parseFloat(a) * parseFloat(b);
    });

    handlebars.registerHelper('padNumber', (num, length) => {
      return String(num).padStart(length, '0');
    });

    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }
}

module.exports = PDFService;

