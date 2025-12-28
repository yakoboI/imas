const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

// User authentication
router.post('/login', authLimiter, AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', authenticate, AuthController.logout);

// Password reset
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Passkey routes
const passkeyRoutes = require('./passkey.routes');
router.use('/passkey', passkeyRoutes);

module.exports = router;

