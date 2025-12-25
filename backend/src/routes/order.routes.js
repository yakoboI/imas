const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All order routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Order routes
router.get('/', OrderController.getAllOrders);
router.get('/product/:productId', OrderController.getOrdersByProduct); // Get orders by product
router.post('/', authorize('admin'), OrderController.createOrder); // Only admin can create orders
router.get('/:id', OrderController.getOrderById);
router.put('/:id', authorize('admin'), OrderController.updateOrder); // Only admin can update
router.put('/:id/cancel', authorize('admin'), OrderController.cancelOrder);
router.put('/:id/complete', authorize('admin'), OrderController.completeOrder);

module.exports = router;

