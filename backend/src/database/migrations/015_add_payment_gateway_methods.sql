-- Add payment gateway methods to payment_method CHECK constraint
-- PostgreSQL uses CHECK constraints (not ENUM) for payment_method validation

-- Update orders table payment_method constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money', 'credit', 'pesapal', 'flutterwave', 'dpo'));

-- Update receipts table payment_method constraint
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_payment_method_check;
ALTER TABLE receipts ADD CONSTRAINT receipts_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money', 'credit', 'pesapal', 'flutterwave', 'dpo'));

