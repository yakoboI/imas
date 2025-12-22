const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All inventory routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Inventory routes
router.get('/stats', InventoryController.getInventoryStats);
router.get('/', InventoryController.getAllInventory);
router.get('/:id', InventoryController.getInventoryById);
router.post('/adjust', authorize('admin'), InventoryController.adjustStock); // Only admin can adjust stock

module.exports = router;

