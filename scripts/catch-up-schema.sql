-- Ka Sari-Sari — CLOUD SCHEMA CATCH-UP (migrations 004–008)
-- =========================================================================
-- Your cloud DB (project skehngwpppcmjmtxxxsy) is on the original 001–003
-- schema. The app's later features (POS offline sync, admin settings, the
-- 'packed'/'assigned' statuses, and the driver fields) need 004–008.
--
-- This script is IDEMPOTENT and HALT-PROOF: every statement is guarded, so
-- you can paste the whole thing into Supabase → SQL Editor → Run, as many
-- times as you like, with no errors even if parts are already present.
-- It contains NO seed data — it only adds missing tables/columns/functions.
-- =========================================================================

-- ── 004: POS transactions + support tickets ──────────────────────────────
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_ref TEXT,
  pos_type TEXT NOT NULL DEFAULT 'walk_in',
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets  ENABLE ROW LEVEL SECURITY;

-- DROP-then-CREATE so re-running never errors on an existing policy.
DROP POLICY IF EXISTS "retailer_own_pos" ON pos_transactions;
CREATE POLICY "retailer_own_pos" ON pos_transactions FOR ALL USING (retailer_id = auth.uid());
DROP POLICY IF EXISTS "user_own_tickets" ON support_tickets;
CREATE POLICY "user_own_tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());

GRANT ALL ON pos_transactions TO service_role;
GRANT ALL ON support_tickets  TO service_role;
GRANT SELECT, INSERT ON pos_transactions TO authenticated;
GRANT SELECT, INSERT ON support_tickets  TO authenticated;

-- ── 005: offline-POS idempotency columns + record_pos_sale() ─────────────
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_txn_id     UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS device_id         TEXT,
  ADD COLUMN IF NOT EXISTS client_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pos_retailer_created
  ON pos_transactions(retailer_id, created_at DESC);

ALTER TABLE pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_receipt_number_key;

CREATE OR REPLACE FUNCTION record_pos_sale(
  p_client_txn_id     UUID,
  p_retailer_id       UUID,
  p_device_id         TEXT,
  p_items             JSONB,
  p_total             NUMERIC,
  p_method            TEXT,
  p_ref               TEXT,
  p_pos_type          TEXT,
  p_receipt           TEXT,
  p_client_created_at TIMESTAMPTZ
) RETURNS pos_transactions LANGUAGE plpgsql AS $$
DECLARE
  v_row pos_transactions;
BEGIN
  INSERT INTO pos_transactions
    (client_txn_id, retailer_id, device_id, items, total,
     payment_method, payment_ref, pos_type, receipt_number, client_created_at)
  VALUES
    (p_client_txn_id, p_retailer_id, p_device_id, p_items, p_total,
     p_method, p_ref, p_pos_type, p_receipt, p_client_created_at)
  ON CONFLICT (client_txn_id) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM pos_transactions WHERE client_txn_id = p_client_txn_id;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION record_pos_sale(
  UUID, UUID, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

-- ── 006: anon lockdown + status constraints + deliveries.scheduled_date ──
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON categories, products TO anon;

ALTER TABLE otp_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_settlements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock        ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_attempts    ENABLE ROW LEVEL SECURITY;

-- orders.status must allow 'packed'; deliveries.status must allow 'assigned'.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending','confirmed','picking','picked','packed',
             'dispatched','out_for_delivery','delivered','failed','cancelled')
);

ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (
  status IN ('pending','assigned','en_route','arrived','delivered','failed','returned')
);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- ── 007: app_settings (admin Settings + WhatsApp config persistence) ─────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON app_settings TO service_role;

-- ── 008: driver/profile fields on users  ← fixes /api/admin/drivers 500 ──
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type  TEXT,
  ADD COLUMN IF NOT EXISTS area          TEXT,
  ADD COLUMN IF NOT EXISTS gcash_number  TEXT;

-- Refresh PostgREST's schema cache so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
