-- Migration: Add system_logs_archive table
-- This migration adds the archive table for system logs

-- System Logs Archive table (for archived system logs)
CREATE TABLE IF NOT EXISTS system_logs_archive (
  id UUID PRIMARY KEY,
  superadmin_id UUID REFERENCES superadmins(id),
  action VARCHAR(100) NOT NULL,
  target_tenant_id UUID REFERENCES tenants(id),
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_archive_superadmin_id ON system_logs_archive(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_archive_target_tenant_id ON system_logs_archive(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_archive_action ON system_logs_archive(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_archive_timestamp ON system_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_archive_archived_at ON system_logs_archive(archived_at);

