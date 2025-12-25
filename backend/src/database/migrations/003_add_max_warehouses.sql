-- Add max_warehouses column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_warehouses INTEGER DEFAULT 1;

-- Update existing tenants based on their plan_type
UPDATE tenants SET max_warehouses = 1 WHERE plan_type = 'free';
UPDATE tenants SET max_warehouses = 1 WHERE plan_type = 'basic';
UPDATE tenants SET max_warehouses = 3 WHERE plan_type = 'professional';
UPDATE tenants SET max_warehouses = 999999 WHERE plan_type = 'enterprise';

