const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All product routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Product routes
router.get('/', ProductController.getAllProducts);
router.post('/', ProductController.createProduct);
router.get('/:id', ProductController.getProductById);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;

