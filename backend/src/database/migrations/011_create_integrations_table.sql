-- Create integrations table for storing tenant integration configurations
-- This table stores all external service integrations (payment gateways, e-commerce, accounting, etc.)

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending_verification')),
  credentials JSONB NOT NULL DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, integration_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type_status ON integrations(integration_type, status);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_integrations_verified ON integrations(tenant_id, verified) WHERE verified = true;

-- Add comments
COMMENT ON TABLE integrations IS 'Stores tenant-specific integration configurations for external services';
COMMENT ON COLUMN integrations.integration_type IS 'Type of integration: pesapal, flutterwave, dpo, shopify, quickbooks, xero, whatsapp';
COMMENT ON COLUMN integrations.status IS 'Current status of the integration: active, inactive, error, pending_verification';
COMMENT ON COLUMN integrations.credentials IS 'Encrypted credentials stored as JSONB (keys, secrets, tokens, etc.)';
COMMENT ON COLUMN integrations.configuration IS 'Non-sensitive configuration settings (API endpoints, environment, etc.)';
COMMENT ON COLUMN integrations.verified IS 'Whether the integration credentials have been verified with the external service';
COMMENT ON COLUMN integrations.last_sync_at IS 'Timestamp of last successful sync operation';
COMMENT ON COLUMN integrations.last_error IS 'Last error message if integration failed';

