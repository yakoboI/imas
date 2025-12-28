const crypto = require('crypto');

// Encryption key - should be stored in environment variable
// For production, use: process.env.ENCRYPTION_KEY (32-byte key for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

// Ensure we have a valid 32-byte key
let encryptionKey;
if (process.env.ENCRYPTION_KEY) {
  // Convert hex string to buffer if provided as hex
  encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  if (encryptionKey.length !== 32) {
    console.warn('⚠️  ENCRYPTION_KEY must be 32 bytes (64 hex characters). Using fallback.');
    encryptionKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }
} else {
  // Generate a key from a default (should be changed in production!)
  encryptionKey = crypto.scryptSync('default-change-in-production', 'salt', 32);
  console.warn('⚠️  Using default encryption key. Set ENCRYPTION_KEY environment variable for production!');
}

/**
 * Encrypt sensitive data (like certificate passwords)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text (iv:encryptedData format)
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv:encryptedData format for storage
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text (iv:encryptedData format)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

module.exports = {
  encrypt,
  decrypt
};

