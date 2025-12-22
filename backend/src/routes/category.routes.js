const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All category routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Category routes
router.get('/', CategoryController.getAllCategories);
router.post('/', authorize('admin'), CategoryController.createCategory);
router.get('/:id', CategoryController.getCategoryById);
router.put('/:id', authorize('admin'), CategoryController.updateCategory);
router.delete('/:id', authorize('admin'), CategoryController.deleteCategory);

module.exports = router;

