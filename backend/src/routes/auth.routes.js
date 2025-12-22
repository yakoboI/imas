const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// User authentication
router.post('/login', authLimiter, AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);

// Password reset
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;

