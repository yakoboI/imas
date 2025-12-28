import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from './api';

const passkeyService = {
  /**
   * Check if user has passkeys registered
   */
  checkPasskeys: async (email) => {
    if (!email || typeof email !== 'string') {
      return false;
    }
    // Normalize email: trim and lowercase
    const normalizedEmail = email.trim().toLowerCase();
    const response = await api.get('/auth/passkey/passkeys/check', {
      params: { email: normalizedEmail }
    });
    return response.data.hasPasskeys === true;
  },

  /**
   * Start passkey registration - get challenge from server
   */
  startRegistration: async () => {
    const response = await api.post('/auth/passkey/register');
    return response.data.options;
  },

  /**
   * Complete passkey registration - send credential to server
   */
  completeRegistration: async (options, deviceName = null) => {
    // Check if we're on HTTPS (required for passkeys in production)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      throw new Error('Passkeys require HTTPS. Please access the site using HTTPS.');
    }

    // Use browser API to create credential
    let credential;
    try {
      credential = await startRegistration(options);
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        throw new Error('This device already has a passkey registered. Please use a different device or remove the existing passkey.');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Registration was cancelled or timed out.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Passkeys are not supported on this device or browser.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Security error: The origin or RP ID may be misconfigured. Please contact support.');
      }
      throw new Error(`Registration failed: ${error.message}`);
    }

    // Send credential to server for verification
    try {
      const response = await api.post('/auth/passkey/register/complete', {
        credential,
        deviceName
      });
      return response.data;
    } catch (error) {
      // Provide more helpful error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes('Verification failed') || errorMessage.includes('origin') || errorMessage.includes('RP ID')) {
          throw new Error('Passkey registration failed due to configuration error. Please contact support.');
        }
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Start passkey authentication - get challenge from server
   */
  startAuthentication: async (email) => {
    // Normalize email: ensure it's a string
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email cannot be empty');
    }
    const response = await api.post('/auth/passkey/login', { email: normalizedEmail });
    return response.data.options;
  },

  /**
   * Complete passkey authentication - send credential to server
   */
  completeAuthentication: async (email, options) => {
    // Normalize email: ensure it's a string
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email cannot be empty');
    }

    // Check if we're on HTTPS (required for passkeys in production)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      throw new Error('Passkeys require HTTPS. Please access the site using HTTPS.');
    }

    // Use browser API to authenticate
    let credential;
    try {
      credential = await startAuthentication(options);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Authentication was cancelled or timed out.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Passkeys are not supported on this device or browser.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Security error: The origin or RP ID may be misconfigured. Please contact support.');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }

    // Send credential to server for verification
    try {
      const response = await api.post('/auth/passkey/login/complete', {
        email: normalizedEmail,
        credential
      });
      return response.data;
    } catch (error) {
      // Provide more helpful error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes('Verification failed') || errorMessage.includes('origin') || errorMessage.includes('RP ID')) {
          throw new Error('Passkey authentication failed due to configuration error. Please contact support.');
        }
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Get user's passkeys
   */
  getUserPasskeys: async () => {
    const response = await api.get('/auth/passkey/passkeys');
    return response.data.passkeys;
  },

  /**
   * Delete a passkey
   */
  deletePasskey: async (passkeyId) => {
    const response = await api.delete(`/auth/passkey/passkeys/${passkeyId}`);
    return response.data;
  },

  /**
   * Check if passkeys are supported in this browser
   */
  isSupported: () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof window.navigator.credentials !== 'undefined' &&
      typeof window.navigator.credentials.create !== 'undefined'
    );
  },

  /**
   * Check if platform authenticator is available (TouchID, FaceID, Windows Hello)
   */
  async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      return false;
    }
  }
};

export default passkeyService;

