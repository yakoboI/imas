const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Profile routes (authenticated users)
// These will be available under /api/profile/... because this router is mounted at /api
router.get('/profile', authenticate, tenantResolver, UserController.getProfile);
router.put('/profile', authenticate, tenantResolver, UserController.updateProfile);
router.put('/profile/avatar', authenticate, tenantResolver, UserController.upload, UserController.uploadAvatar);
router.put('/profile/password', authenticate, tenantResolver, UserController.changePassword);
router.get('/profile/activity', authenticate, tenantResolver, UserController.getActivity);
router.get('/profile/notifications', authenticate, tenantResolver, UserController.getNotificationPreferences);
router.put('/profile/notifications', authenticate, tenantResolver, UserController.updateNotificationPreferences);

// User management routes (Admin only)
// These will be available under /api/users/... because this router is mounted at /api
router.get('/users', authenticate, tenantResolver, authorize('admin'), UserController.getAllUsers);
router.post('/users', authenticate, tenantResolver, authorize('admin'), UserController.createUser);
router.get('/users/:id', authenticate, tenantResolver, authorize('admin'), UserController.getUserById);
router.put('/users/:id', authenticate, tenantResolver, authorize('admin'), UserController.updateUser);
router.delete('/users/:id', authenticate, tenantResolver, authorize('admin'), UserController.deleteUser);

module.exports = router;

