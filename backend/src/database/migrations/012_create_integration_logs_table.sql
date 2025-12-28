-- Create integration_logs table for tracking all integration activity
-- This table logs webhooks, API calls, sync operations, and errors

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  payload JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  external_id VARCHAR(255),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant_integration ON integration_logs(tenant_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_entity ON integration_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_external_id ON integration_logs(external_id) WHERE external_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE integration_logs IS 'Logs all integration activity including webhooks, API calls, and sync operations';
COMMENT ON COLUMN integration_logs.event_type IS 'Type of event: webhook_received, api_call, sync_completed, error, etc.';
COMMENT ON COLUMN integration_logs.direction IS 'Direction of the event: inbound (webhook from external) or outbound (API call to external)';
COMMENT ON COLUMN integration_logs.payload IS 'Event payload/data in JSONB format';
COMMENT ON COLUMN integration_logs.external_id IS 'ID from external system (transaction_id, order_id, etc.)';
COMMENT ON COLUMN integration_logs.related_entity_type IS 'Related entity type in local system: order, invoice, payment, etc.';
COMMENT ON COLUMN integration_logs.related_entity_id IS 'ID of related entity in local system';

