-- Add TRA EFDMS response fields to receipts table
-- These fields store the response data from TRA API after invoice submission

ALTER TABLE receipts 
  ADD COLUMN IF NOT EXISTS tra_receipt_number VARCHAR(100), -- EFDMS Receipt Number from TRA
  ADD COLUMN IF NOT EXISTS tra_qr_code TEXT, -- QR code data/image from TRA
  ADD COLUMN IF NOT EXISTS tra_fiscal_code VARCHAR(100), -- Fiscal code from TRA
  ADD COLUMN IF NOT EXISTS tra_submitted BOOLEAN DEFAULT false, -- Whether invoice was submitted to TRA
  ADD COLUMN IF NOT EXISTS tra_submitted_at TIMESTAMP, -- When invoice was submitted to TRA
  ADD COLUMN IF NOT EXISTS tra_submission_error TEXT; -- Error message if TRA submission failed

-- Create index for TRA receipt number (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_receipts_tra_receipt_number ON receipts(tra_receipt_number) WHERE tra_receipt_number IS NOT NULL;

-- Create index for TRA submitted receipts (for reporting)
CREATE INDEX IF NOT EXISTS idx_receipts_tra_submitted ON receipts(tra_submitted, tra_submitted_at) WHERE tra_submitted = true;

-- Add comments to explain the fields
COMMENT ON COLUMN receipts.tra_receipt_number IS 'EFDMS Receipt Number returned by TRA API';
COMMENT ON COLUMN receipts.tra_qr_code IS 'QR code data/image returned by TRA API';
COMMENT ON COLUMN receipts.tra_fiscal_code IS 'Fiscal code returned by TRA API';
COMMENT ON COLUMN receipts.tra_submitted IS 'Whether the invoice was successfully submitted to TRA EFDMS';
COMMENT ON COLUMN receipts.tra_submitted_at IS 'Timestamp when invoice was submitted to TRA';
COMMENT ON COLUMN receipts.tra_submission_error IS 'Error message if TRA submission failed';

