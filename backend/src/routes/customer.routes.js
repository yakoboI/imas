const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// All customer routes require authentication
router.use(authenticate);
router.use(tenantResolver);

// Customer routes
router.get('/', CustomerController.getAllCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router;

