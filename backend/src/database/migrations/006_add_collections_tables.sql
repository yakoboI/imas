-- Create collections management tables for daily sales and inventory tracking

-- Stock Sessions table
CREATE TABLE IF NOT EXISTS stock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_time TIME NOT NULL DEFAULT '00:01:00',
  closing_time TIME,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  auto_opened BOOLEAN DEFAULT false,
  auto_closed BOOLEAN DEFAULT false,
  opening_stock_snapshot JSONB,
  closing_stock_snapshot JSONB,
  opening_stock_value DECIMAL(12, 2) DEFAULT 0,
  closing_stock_value DECIMAL(12, 2) DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_receipts INTEGER DEFAULT 0,
  pdf_report_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_stock_sessions_tenant_id ON stock_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_sessions_date ON stock_sessions(date);
CREATE INDEX IF NOT EXISTS idx_stock_sessions_status ON stock_sessions(status);
CREATE INDEX IF NOT EXISTS idx_stock_sessions_tenant_date ON stock_sessions(tenant_id, date);

-- Sub Sessions table (for mid-day stock changes)
CREATE TABLE IF NOT EXISTS sub_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  opened_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  stock_snapshot JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_sessions_parent_session_id ON sub_sessions(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_sub_sessions_tenant_id ON sub_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_sessions_status ON sub_sessions(status);

-- Collections Receipts table
CREATE TABLE IF NOT EXISTS collections_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
  sub_session_id UUID REFERENCES sub_sessions(id) ON DELETE SET NULL,
  receipt_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, session_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_collections_receipts_tenant_id ON collections_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipts_session_id ON collections_receipts(session_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipts_sub_session_id ON collections_receipts(sub_session_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipts_receipt_number ON collections_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_collections_receipts_timestamp ON collections_receipts(timestamp);

-- Collections Receipt Items table
CREATE TABLE IF NOT EXISTS collections_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES collections_receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collections_receipt_items_tenant_id ON collections_receipt_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipt_items_receipt_id ON collections_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipt_items_product_id ON collections_receipt_items(product_id);

-- Stock Adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
  sub_session_id UUID REFERENCES sub_sessions(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('addition', 'removal', 'correction')),
  adjusted_by UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_tenant_id ON stock_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_session_id ON stock_adjustments(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_sub_session_id ON stock_adjustments(sub_session_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_timestamp ON stock_adjustments(timestamp);

-- Daily Summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES stock_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  closing_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_receipts INTEGER NOT NULL DEFAULT 0,
  value_of_goods_sold DECIMAL(12, 2) NOT NULL DEFAULT 0,
  variance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  pdf_path VARCHAR(500),
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  summary_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_session_id ON daily_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_tenant_id ON daily_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_generated_at ON daily_summaries(generated_at);

