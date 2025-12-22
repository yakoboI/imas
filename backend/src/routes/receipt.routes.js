const express = require('express');
const router = express.Router();
const ReceiptController = require('../controllers/receiptController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');
const { receiptLimiter } = require('../middleware/rateLimiter');

// All receipt routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Receipt generation and management
router.get('/', authorize('admin', 'sales_manager', 'sales_staff', 'accountant'), ReceiptController.listReceipts);
router.post('/generate', receiptLimiter, authorize('admin', 'sales_manager', 'sales_staff'), ReceiptController.generateReceipt);
router.get('/:id', authorize('admin', 'sales_manager', 'sales_staff', 'accountant'), ReceiptController.getReceipt);
router.get('/:id/pdf', authorize('admin', 'sales_manager', 'sales_staff', 'accountant'), ReceiptController.downloadPDF);
router.get('/:id/preview', authorize('admin', 'sales_manager', 'sales_staff'), ReceiptController.previewReceipt);
router.post('/:id/email', authorize('admin', 'sales_manager', 'sales_staff'), ReceiptController.emailReceipt);
router.post('/:id/void', authorize('admin', 'sales_manager'), ReceiptController.voidReceipt);
router.get('/:id/audit', authorize('admin', 'sales_manager'), ReceiptController.getReceiptAudit);

module.exports = router;

