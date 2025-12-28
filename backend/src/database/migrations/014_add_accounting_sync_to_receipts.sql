-- Add accounting software sync fields to receipts table
-- These fields track whether receipts/invoices have been synced to accounting software

ALTER TABLE receipts 
  ADD COLUMN IF NOT EXISTS synced_to_accounting BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accounting_invoice_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS accounting_synced_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS accounting_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS accounting_provider VARCHAR(50); -- 'quickbooks', 'xero', etc.

-- Create indexes for accounting sync queries
CREATE INDEX IF NOT EXISTS idx_receipts_accounting_synced ON receipts(synced_to_accounting, accounting_provider) WHERE synced_to_accounting = false;
CREATE INDEX IF NOT EXISTS idx_receipts_accounting_invoice_id ON receipts(accounting_invoice_id) WHERE accounting_invoice_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN receipts.synced_to_accounting IS 'Whether the receipt has been successfully synced to accounting software';
COMMENT ON COLUMN receipts.accounting_invoice_id IS 'Invoice ID in the accounting software (QuickBooks, Xero, etc.)';
COMMENT ON COLUMN receipts.accounting_synced_at IS 'Timestamp when the receipt was synced to accounting software';
COMMENT ON COLUMN receipts.accounting_sync_error IS 'Error message if accounting sync failed';
COMMENT ON COLUMN receipts.accounting_provider IS 'Accounting software provider: quickbooks, xero, etc.';

