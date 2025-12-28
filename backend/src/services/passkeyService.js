const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { isoBase64URL, isoUint8Array } = require('@simplewebauthn/server/helpers');
const Passkey = require('../models/Passkey');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const AuthService = require('./authService');

// Get Relying Party info from environment or use defaults
const rpName = process.env.RP_NAME || 'IMAS Inventory System';

// Helper function to safely convert input to string
const safeString = (input) => {
  if (input == null) return null;
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) return input[0] ? String(input[0]) : null;
  if (typeof input === 'object') return null; // Don't try to stringify objects
  return String(input);
};

// Helper function to extract domain from URL (remove protocol and trailing slash)
const extractDomain = (url) => {
  const urlString = safeString(url);
  if (!urlString) return null;
  try {
    return urlString.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
  } catch (error) {
    console.error('[PasskeyService] Error extracting domain from:', url, error);
    return null;
  }
};

// Helper function to ensure HTTPS in production
const ensureHttps = (url) => {
  const urlString = safeString(url);
  if (!urlString) return urlString;
  try {
    if (process.env.NODE_ENV === 'production' && urlString.startsWith('http://') && !urlString.includes('localhost')) {
      return urlString.replace('http://', 'https://');
    }
    return urlString;
  } catch (error) {
    console.error('[PasskeyService] Error ensuring HTTPS for:', url, error);
    return urlString;
  }
};

// RP ID must be just the domain name (no protocol, no path)
// Priority: RP_ID > DOMAIN > FRONTEND_URL > localhost
let rpID = 'localhost';
try {
  if (process.env.RP_ID) {
    const extracted = extractDomain(process.env.RP_ID);
    if (extracted) rpID = extracted;
  } else if (process.env.NODE_ENV === 'production') {
    const domainExtracted = extractDomain(process.env.DOMAIN);
    const frontendExtracted = extractDomain(process.env.FRONTEND_URL);
    rpID = domainExtracted || frontendExtracted || 'localhost';
  }
} catch (error) {
  console.error('[PasskeyService] Error setting RP_ID:', error);
  rpID = 'localhost';
}

// Origin must be the full URL with protocol
// Priority: ORIGIN > FRONTEND_URL (with HTTPS in production) > localhost
let origin = 'http://localhost:3000';
try {
  if (process.env.ORIGIN) {
    const ensured = ensureHttps(process.env.ORIGIN);
    if (ensured) origin = ensured;
  } else if (process.env.NODE_ENV === 'production') {
    const frontendEnsured = ensureHttps(process.env.FRONTEND_URL);
    origin = frontendEnsured || 'https://app.inventora.store';
  }
} catch (error) {
  console.error('[PasskeyService] Error setting ORIGIN:', error);
  origin = process.env.NODE_ENV === 'production' ? 'https://app.inventora.store' : 'http://localhost:3000';
}

// Log configuration in production for debugging (only once at startup)
if (process.env.NODE_ENV === 'production' && !global.passkeyConfigLogged) {
  console.log('[PasskeyService] Production Configuration:');
  console.log(`  RP_NAME: ${rpName}`);
  console.log(`  RP_ID: ${rpID}`);
  console.log(`  ORIGIN: ${origin}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  if (rpID === 'localhost' || origin.includes('localhost')) {
    console.warn('[PasskeyService] WARNING: Using localhost values in production!');
    console.warn('[PasskeyService] Set RP_ID and ORIGIN environment variables for production.');
  }
  global.passkeyConfigLogged = true;
}

class PasskeyService {
  /**
   * Start passkey registration - generate challenge for user
   */
  static async startRegistration(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    // Get existing passkeys for this user
    const existingPasskeys = await Passkey.findAll({
      where: { user_id: userId }
    });

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoUint8Array.fromUTF8String(userId),
      userName: user.email,
      userDisplayName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      timeout: 60000, // 60 seconds
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map(passkey => ({
        id: isoBase64URL.toBuffer(passkey.credential_id),
        type: 'public-key'
      })),
      authenticatorSelection: {
        // Allow both platform (TouchID, FaceID, Windows Hello) and cross-platform (USB keys) authenticators
        userVerification: 'preferred',
        requireResidentKey: false
      },
      supportedAlgorithmIDs: [-7, -257] // ES256, RS256
    });

    // Store challenge temporarily (in production, use Redis or database)
    // For simplicity, we'll use a simple in-memory store (replace with Redis in production)
    if (!global.passkeyChallenges) {
      global.passkeyChallenges = new Map();
    }
    global.passkeyChallenges.set(`registration:${userId}`, {
      challenge: options.challenge,
      userId,
      timestamp: Date.now()
    });

    // Clean up old challenges (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of global.passkeyChallenges.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        global.passkeyChallenges.delete(key);
      }
    }

    return options;
  }

  /**
   * Complete passkey registration - verify and save credential
   */
  static async completeRegistration(userId, registrationResponse, deviceName = null) {
    const user = await User.findByPk(userId, {
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Retrieve stored challenge
    if (!global.passkeyChallenges) {
      throw new Error('Registration session expired. Please try again.');
    }

    const storedChallenge = global.passkeyChallenges.get(`registration:${userId}`);
    if (!storedChallenge) {
      throw new Error('Registration session expired. Please try again.');
    }

    // Clean up challenge
    global.passkeyChallenges.delete(`registration:${userId}`);

    // Verify registration response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true
      });
    } catch (error) {
      // Log detailed error in production for debugging
      if (process.env.NODE_ENV === 'production') {
        console.error('[PasskeyService] Registration verification failed:', {
          error: error.message,
          expectedOrigin: origin,
          expectedRPID: rpID,
          actualOrigin: registrationResponse?.response?.clientDataJSON ? 
            JSON.parse(Buffer.from(registrationResponse.response.clientDataJSON, 'base64url').toString()).origin : 'unknown'
        });
      }
      throw new Error(`Verification failed: ${error.message}`);
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new Error('Passkey verification failed');
    }

    const { credentialID, credentialPublicKey, counter } = registrationInfo;

    // Check if credential already exists
    const existingPasskey = await Passkey.findOne({
      where: {
        credential_id: isoBase64URL.fromBuffer(credentialID)
      }
    });

    if (existingPasskey) {
      throw new Error('This passkey is already registered');
    }

    // Save passkey to database
    const passkey = await Passkey.create({
      user_id: userId,
      credential_id: isoBase64URL.fromBuffer(credentialID),
      public_key: isoBase64URL.fromBuffer(credentialPublicKey),
      counter: counter || 0,
      device_name: deviceName || 'Unknown Device'
    });

    return {
      verified: true,
      passkey: {
        id: passkey.id,
        deviceName: passkey.device_name,
        createdAt: passkey.created_at
      }
    };
  }

  /**
   * Start passkey authentication - generate challenge for login
   */
  static async startAuthentication(email) {
    // Normalize email: ensure it's a string and trim/lowercase
    if (typeof email !== 'string') {
      email = String(email);
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { 
        email: {
          [Op.iLike]: normalizedEmail // Case-insensitive lookup
        }
      },
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    if (!user.tenant || user.tenant.status !== 'active') {
      throw new Error('Tenant account is not active');
    }

    // Get user's passkeys
    const passkeys = await Passkey.findAll({
      where: { user_id: user.id }
    });

    if (passkeys.length === 0) {
      throw new Error('No passkeys registered for this user');
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000, // 60 seconds
      allowCredentials: passkeys.map(passkey => ({
        id: isoBase64URL.toBuffer(passkey.credential_id),
        type: 'public-key'
      })),
      userVerification: 'preferred'
    });

    // Store challenge temporarily
    if (!global.passkeyChallenges) {
      global.passkeyChallenges = new Map();
    }
    global.passkeyChallenges.set(`authentication:${user.id}`, {
      challenge: options.challenge,
      userId: user.id,
      timestamp: Date.now()
    });

    // Clean up old challenges
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of global.passkeyChallenges.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        global.passkeyChallenges.delete(key);
      }
    }

    return options;
  }

  /**
   * Complete passkey authentication - verify and return JWT token
   */
  static async completeAuthentication(email, authenticationResponse) {
    // Normalize email: ensure it's a string and trim/lowercase
    if (typeof email !== 'string') {
      email = String(email);
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { 
        email: {
          [Op.iLike]: normalizedEmail // Case-insensitive lookup
        }
      },
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Retrieve stored challenge
    if (!global.passkeyChallenges) {
      throw new Error('Authentication session expired. Please try again.');
    }

    const storedChallenge = global.passkeyChallenges.get(`authentication:${user.id}`);
    if (!storedChallenge) {
      throw new Error('Authentication session expired. Please try again.');
    }

    // Get the passkey being used
    const credentialId = authenticationResponse.id;
    const passkey = await Passkey.findOne({
      where: {
        user_id: user.id,
        credential_id: credentialId
      }
    });

    if (!passkey) {
      throw new Error('Passkey not found');
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: isoBase64URL.toBuffer(passkey.credential_id),
          credentialPublicKey: isoBase64URL.toBuffer(passkey.public_key),
          counter: passkey.counter.toString()
        },
        requireUserVerification: true
      });
    } catch (error) {
      // Log detailed error in production for debugging
      if (process.env.NODE_ENV === 'production') {
        console.error('[PasskeyService] Authentication verification failed:', {
          error: error.message,
          expectedOrigin: origin,
          expectedRPID: rpID,
          userId: user.id,
          email: user.email,
          actualOrigin: authenticationResponse?.response?.clientDataJSON ? 
            JSON.parse(Buffer.from(authenticationResponse.response.clientDataJSON, 'base64url').toString()).origin : 'unknown'
        });
      }
      throw new Error(`Verification failed: ${error.message}`);
    }

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      throw new Error('Passkey verification failed');
    }

    // Update passkey counter and last used timestamp
    await passkey.update({
      counter: authenticationInfo.newCounter,
      last_used_at: new Date()
    });

    // Clean up challenge
    global.passkeyChallenges.delete(`authentication:${user.id}`);

    // Update user last login
    await user.update({
      last_login: new Date(),
      login_count: (user.login_count || 0) + 1
    });

    // Generate JWT token (same as password login)
    const token = await AuthService.generateUserToken(user);

    return {
      verified: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain
        }
      }
    };
  }

  /**
   * Get all passkeys for a user
   */
  static async getUserPasskeys(userId) {
    const passkeys = await Passkey.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return passkeys.map(passkey => ({
      id: passkey.id,
      deviceName: passkey.device_name,
      createdAt: passkey.created_at,
      lastUsedAt: passkey.last_used_at
    }));
  }

  /**
   * Delete a passkey
   */
  static async deletePasskey(userId, passkeyId) {
    const passkey = await Passkey.findOne({
      where: {
        id: passkeyId,
        user_id: userId
      }
    });

    if (!passkey) {
      throw new Error('Passkey not found');
    }

    await passkey.destroy();

    return { message: 'Passkey deleted successfully' };
  }

  /**
   * Check if user has passkeys registered
   */
  static async hasPasskeys(userId) {
    try {
      if (!userId) {
        return false;
      }
      
      // Use findAll and check length instead of count for more reliability
      const passkeys = await Passkey.findAll({
        where: { user_id: userId },
        limit: 1 // Only need to know if at least one exists
      });
      
      return passkeys.length > 0;
    } catch (error) {
      // If there's an error, return false instead of throwing
      // This prevents the check from breaking the login flow
      return false;
    }
  }
}

module.exports = PasskeyService;

