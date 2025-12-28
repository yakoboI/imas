import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from './api';

const passkeyService = {
  /**
   * Check if user has passkeys registered
   */
  checkPasskeys: async (email) => {
    const response = await api.get('/auth/passkeys/check', {
      params: { email }
    });
    return response.data.hasPasskeys;
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
      }
      throw new Error(`Registration failed: ${error.message}`);
    }

    // Send credential to server for verification
    const response = await api.post('/auth/passkey/register/complete', {
      credential,
      deviceName
    });
    return response.data;
  },

  /**
   * Start passkey authentication - get challenge from server
   */
  startAuthentication: async (email) => {
    const response = await api.post('/auth/passkey/login', { email });
    return response.data.options;
  },

  /**
   * Complete passkey authentication - send credential to server
   */
  completeAuthentication: async (email, options) => {
    // Use browser API to authenticate
    let credential;
    try {
      credential = await startAuthentication(options);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Authentication was cancelled or timed out.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Passkeys are not supported on this device or browser.');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }

    // Send credential to server for verification
    const response = await api.post('/auth/passkey/login/complete', {
      email,
      credential
    });
    return response.data;
  },

  /**
   * Get user's passkeys
   */
  getUserPasskeys: async () => {
    const response = await api.get('/auth/passkeys');
    return response.data.passkeys;
  },

  /**
   * Delete a passkey
   */
  deletePasskey: async (passkeyId) => {
    const response = await api.delete(`/auth/passkeys/${passkeyId}`);
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

