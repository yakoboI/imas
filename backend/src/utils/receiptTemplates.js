// Receipt templates for different formats

const thermalTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      width: 80mm;
      margin: 0;
      padding: 10px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .logo {
      max-width: 60mm;
      margin: 0 auto;
    }
    .company-name {
      font-weight: bold;
      font-size: 14px;
      margin: 5px 0;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .receipt-info {
      margin: 10px 0;
    }
    .items {
      margin: 10px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .totals {
      margin-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    {{#if company.logo}}
    <img src="{{company.logo}}" alt="Logo" class="logo">
    {{/if}}
    <div class="company-name">{{company.name}}</div>
    {{#if company.address}}
    <div>{{company.address}}</div>
    {{/if}}
    {{#if company.phone}}
    <div>Phone: {{company.phone}}</div>
    {{/if}}
  </div>
  
  <div class="divider"></div>
  
  <div class="receipt-info">
    <div><strong>Receipt:</strong> {{receipt.number}}</div>
    <div><strong>Date:</strong> {{receipt.date}} {{receipt.time}}</div>
    {{#if customer}}
    <div><strong>Customer:</strong> {{customer.name}}</div>
    {{/if}}
  </div>
  
  <div class="divider"></div>
  
  <div class="items">
    {{#each items}}
    <div class="item-row">
      <div>
        <div>{{description}}</div>
        <div style="font-size: 10px;">{{quantity}} x {{unitPrice}}</div>
      </div>
      <div>{{subtotal}}</div>
    </div>
    {{/each}}
  </div>
  
  <div class="divider"></div>
  
  <div class="totals">
    <div class="item-row">
      <div>Subtotal:</div>
      <div>{{receipt.subtotal}}</div>
    </div>
    {{#if receipt.tax}}
    <div class="item-row">
      <div>Tax:</div>
      <div>{{receipt.tax}}</div>
    </div>
    {{/if}}
    {{#if receipt.discount}}
    <div class="item-row">
      <div>Discount:</div>
      <div>-{{receipt.discount}}</div>
    </div>
    {{/if}}
    <div class="total-row">
      <div>TOTAL:</div>
      <div>{{receipt.total}}</div>
    </div>
  </div>
  
  {{#if receipt.paymentMethod}}
  <div class="receipt-info">
    <div><strong>Payment:</strong> {{receipt.paymentMethod}}</div>
  </div>
  {{/if}}
  
  <div class="divider"></div>
  
  <div class="footer">
    <div>Thank you for your business!</div>
    <div>Visit again!</div>
  </div>
</body>
</html>
`;

const a4Template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      font-size: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .company-info {
      flex: 1;
    }
    .logo {
      max-width: 100px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .receipt-title {
      font-size: 28px;
      font-weight: bold;
      text-align: right;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin: 30px 0;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      margin-top: 0;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table th {
      background-color: #f0f0f0;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #000;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      margin: 5px 0;
    }
    .total-label {
      width: 150px;
      text-align: right;
      padding-right: 20px;
    }
    .total-value {
      width: 100px;
      text-align: right;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      {{#if company.logo}}
      <img src="{{company.logo}}" alt="Logo" class="logo">
      {{/if}}
      <div class="company-name">{{company.name}}</div>
      {{#if company.address}}
      <div>{{company.address}}</div>
      {{/if}}
      {{#if company.phone}}
      <div>Phone: {{company.phone}}</div>
      {{/if}}
      {{#if company.email}}
      <div>Email: {{company.email}}</div>
      {{/if}}
      {{#if company.taxId}}
      <div>Tax ID: {{company.taxId}}</div>
      {{/if}}
    </div>
    <div class="receipt-title">RECEIPT</div>
  </div>
  
  <div class="receipt-info">
    <div class="info-section">
      <h3>Receipt Details</h3>
      <div><strong>Receipt Number:</strong> {{receipt.number}}</div>
      <div><strong>Date:</strong> {{receipt.date}}</div>
      <div><strong>Time:</strong> {{receipt.time}}</div>
    </div>
    {{#if customer}}
    <div class="info-section">
      <h3>Bill To</h3>
      <div><strong>{{customer.name}}</strong></div>
      {{#if customer.address}}
      <div>{{customer.address}}</div>
      {{/if}}
      {{#if customer.phone}}
      <div>Phone: {{customer.phone}}</div>
      {{/if}}
      {{#if customer.email}}
      <div>Email: {{customer.email}}</div>
      {{/if}}
    </div>
    {{/if}}
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Tax</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}}</td>
        <td>{{tax}}</td>
        <td>{{subtotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <div class="total-label">Subtotal:</div>
      <div class="total-value">{{receipt.subtotal}}</div>
    </div>
    {{#if receipt.tax}}
    <div class="total-row">
      <div class="total-label">Tax:</div>
      <div class="total-value">{{receipt.tax}}</div>
    </div>
    {{/if}}
    {{#if receipt.discount}}
    <div class="total-row">
      <div class="total-label">Discount:</div>
      <div class="total-value">-{{receipt.discount}}</div>
    </div>
    {{/if}}
    <div class="total-row" style="font-size: 16px; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px;">
      <div class="total-label">TOTAL:</div>
      <div class="total-value">{{receipt.total}}</div>
    </div>
  </div>
  
  {{#if receipt.paymentMethod}}
  <div style="margin-top: 20px;">
    <strong>Payment Method:</strong> {{receipt.paymentMethod}}
  </div>
  {{/if}}
  
  <div class="footer">
    <div>Thank you for your business!</div>
    <div>{{company.name}} - {{company.address}}</div>
  </div>
</body>
</html>
`;

const invoiceTemplate = a4Template; // Invoice uses same template as A4

const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .receipt-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .items {
      margin: 20px 0;
    }
    .item {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      margin: 5px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
  </div>
  
  <p>Dear {{#if customer}}{{customer.name}}{{else}}Customer{{/if}},</p>
  
  <p>Thank you for your purchase! Please find your receipt below:</p>
  
  <div class="receipt-info">
    <div><strong>Receipt Number:</strong> {{receipt.number}}</div>
    <div><strong>Date:</strong> {{receipt.date}} {{receipt.time}}</div>
  </div>
  
  <div class="items">
    {{#each items}}
    <div class="item">
      <div><strong>{{description}}</strong></div>
      <div>Quantity: {{quantity}} × {{unitPrice}} = {{subtotal}}</div>
    </div>
    {{/each}}
  </div>
  
  <div class="totals">
    <div class="total-row"><strong>Subtotal:</strong> {{receipt.subtotal}}</div>
    {{#if receipt.tax}}
    <div class="total-row"><strong>Tax:</strong> {{receipt.tax}}</div>
    {{/if}}
    {{#if receipt.discount}}
    <div class="total-row"><strong>Discount:</strong> -{{receipt.discount}}</div>
    {{/if}}
    <div class="total-row" style="font-size: 18px; margin-top: 10px;">
      <strong>TOTAL: {{receipt.total}}</strong>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>{{company.name}}</p>
    {{#if company.address}}
    <p>{{company.address}}</p>
    {{/if}}
  </div>
</body>
</html>
`;

function getReceiptTemplate(templateType) {
  switch (templateType) {
    case 'thermal':
      return thermalTemplate;
    case 'a4':
      return a4Template;
    case 'invoice':
      return invoiceTemplate;
    case 'email':
      return emailTemplate;
    default:
      return thermalTemplate;
  }
}

module.exports = { getReceiptTemplate };

