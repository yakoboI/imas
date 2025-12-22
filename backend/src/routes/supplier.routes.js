const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All supplier routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Supplier routes
router.get('/', SupplierController.getAllSuppliers);
router.post('/', SupplierController.createSupplier);
router.get('/:id', SupplierController.getSupplierById);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

module.exports = router;

