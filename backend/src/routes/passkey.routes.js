const express = require('express');
const router = express.Router();
const PasskeyController = require('../controllers/passkeyController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Registration routes (require authentication - user must be logged in)
router.post('/register', authenticate, PasskeyController.startRegistration);
router.post('/register/complete', authenticate, PasskeyController.completeRegistration);

// Authentication routes (no authentication required - this is the login flow)
router.post('/login', authLimiter, PasskeyController.startAuthentication);
router.post('/login/complete', authLimiter, PasskeyController.completeAuthentication);

// Passkey management routes (require authentication)
router.get('/passkeys', authenticate, PasskeyController.getUserPasskeys);
router.delete('/passkeys/:id', authenticate, PasskeyController.deletePasskey);

// Check if user has passkeys (public endpoint for login page)
router.get('/passkeys/check', PasskeyController.checkPasskeys);

module.exports = router;

