-- Add payment gateway reference fields to orders table
-- These fields store payment gateway transaction references and gateway type

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway) WHERE payment_gateway IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orders.payment_reference IS 'Transaction ID or reference from payment gateway (Pesapal, Flutterwave, etc.)';
COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: pesapal, flutterwave, dpo, etc.';

