-- Add password reset fields to users table
-- Migration: 007_add_password_reset_fields.sql

-- Add password reset token and expiry fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create index on password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Add comment for documentation
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset requests';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token (typically 1 hour from creation)';

