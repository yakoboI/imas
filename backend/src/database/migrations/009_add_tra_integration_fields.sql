-- Add TRA EFDMS integration fields to tenants table
-- These fields store tenant-specific credentials and configuration for Tanzania Revenue Authority integration

ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS tenant_tin VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vfd_serial_num VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tra_cert_pfx_base64 TEXT,
  ADD COLUMN IF NOT EXISTS cert_password TEXT, -- Encrypted password
  ADD COLUMN IF NOT EXISTS current_global_counter INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_zreport_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS tra_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tra_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS tra_api_endpoint VARCHAR(500); -- Optional: allow different endpoints for test/prod

-- Create index for TRA verified tenants (for faster queries when processing invoices)
CREATE INDEX IF NOT EXISTS idx_tenants_tra_verified ON tenants(tra_verified) WHERE tra_verified = true;

-- Add comment to explain the fields
COMMENT ON COLUMN tenants.tenant_tin IS 'Tanzania Revenue Authority Taxpayer Identification Number';
COMMENT ON COLUMN tenants.vfd_serial_num IS 'Virtual Fiscal Device Serial Number obtained from TRA';
COMMENT ON COLUMN tenants.tra_cert_pfx_base64 IS 'Base64 encoded PFX certificate file for TRA API authentication';
COMMENT ON COLUMN tenants.cert_password IS 'Encrypted password for the PFX certificate';
COMMENT ON COLUMN tenants.current_global_counter IS 'System-managed counter for daily Z-Reports';
COMMENT ON COLUMN tenants.last_zreport_date IS 'Timestamp of the last successful Z-report submission';
COMMENT ON COLUMN tenants.tra_verified IS 'Whether tenant credentials have been verified with TRA API';
COMMENT ON COLUMN tenants.tra_verified_at IS 'When the tenant was verified with TRA API';
COMMENT ON COLUMN tenants.tra_api_endpoint IS 'TRA API endpoint URL (defaults to production if not set)';

