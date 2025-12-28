-- Create user_passkeys table for passkey/WebAuthn authentication
-- Migration: 008_create_user_passkeys_table.sql

CREATE TABLE IF NOT EXISTS user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  
  CONSTRAINT fk_user_passkeys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_credential_id ON user_passkeys(credential_id);

-- Add comment for documentation
COMMENT ON TABLE user_passkeys IS 'Stores passkey credentials for WebAuthn authentication';
COMMENT ON COLUMN user_passkeys.credential_id IS 'Base64URL encoded credential ID (unique identifier)';
COMMENT ON COLUMN user_passkeys.public_key IS 'Base64URL encoded public key (COSE format)';
COMMENT ON COLUMN user_passkeys.counter IS 'Signature counter to prevent replay attacks';
COMMENT ON COLUMN user_passkeys.device_name IS 'User-friendly device name (e.g., "iPhone 13", "Windows Laptop")';

