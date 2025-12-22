const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/warehouseController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All warehouse routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Warehouse routes
router.get('/', WarehouseController.getAllWarehouses);
router.post('/', WarehouseController.createWarehouse);
router.get('/:id', WarehouseController.getWarehouseById);
router.put('/:id', WarehouseController.updateWarehouse);
router.delete('/:id', WarehouseController.deleteWarehouse);

module.exports = router;

