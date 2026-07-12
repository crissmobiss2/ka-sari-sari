-- Ka Sari-Sari — Additional tables for POS, support tickets, categories
-- Run after 003_grants.sql

-- POS transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_ref TEXT,
  pos_type TEXT NOT NULL DEFAULT 'walk_in',
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "retailer_own_pos" ON pos_transactions
  FOR ALL USING (retailer_id = auth.uid());

CREATE POLICY "user_own_tickets" ON support_tickets
  FOR ALL USING (user_id = auth.uid());

-- Grants
GRANT ALL ON pos_transactions TO service_role;
GRANT ALL ON support_tickets TO service_role;
GRANT SELECT, INSERT ON pos_transactions TO authenticated;
GRANT SELECT, INSERT ON support_tickets TO authenticated;
