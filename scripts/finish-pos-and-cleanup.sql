-- Ka Sari-Sari — FINISH offline-POS schema (migrations 004/005) on the REAL app DB.
-- ========================================================================
-- RUN THIS IN:  Supabase dashboard -> project "crissmobiss2's Project"
--               (ref tklqcqrlhybvkihqygfq, ap-southeast-2) -> SQL Editor.
--   NOT the project named "Ka Sari-Sari" (skehngwpppcmjmtxxxsy) -- that one
--   is unused by the app.
-- Idempotent + guarded -> safe to run repeatedly. OPTIONAL for day-1 launch
-- (this only enables the offline-POS sync feature; the core ordering and
-- fulfillment flow already works without it).
-- ========================================================================

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

ALTER TABLE IF EXISTS pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retailer_own_pos" ON pos_transactions;
CREATE POLICY "retailer_own_pos" ON pos_transactions FOR ALL USING (retailer_id = auth.uid());
DROP POLICY IF EXISTS "user_own_tickets" ON support_tickets;
CREATE POLICY "user_own_tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());

GRANT ALL ON pos_transactions TO service_role;
GRANT ALL ON support_tickets  TO service_role;
GRANT SELECT, INSERT ON pos_transactions TO authenticated;
GRANT SELECT, INSERT ON support_tickets  TO authenticated;

ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_txn_id     UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS device_id         TEXT,
  ADD COLUMN IF NOT EXISTS client_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pos_retailer_created
  ON pos_transactions(retailer_id, created_at DESC);

ALTER TABLE pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_receipt_number_key;

CREATE OR REPLACE FUNCTION record_pos_sale(
  p_client_txn_id UUID, p_retailer_id UUID, p_device_id TEXT, p_items JSONB, p_total NUMERIC,
  p_method TEXT, p_ref TEXT, p_pos_type TEXT, p_receipt TEXT, p_client_created_at TIMESTAMPTZ
) RETURNS pos_transactions LANGUAGE plpgsql AS $func$
DECLARE v_row pos_transactions;
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
$func$;

GRANT EXECUTE ON FUNCTION record_pos_sale(
  UUID, UUID, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

NOTIFY pgrst, 'reload schema';

-- ── OPTIONAL cleanup: remove the throwaway users I created while verifying ──
-- (Uncomment the next line to delete them; each has no real data.)
-- DELETE FROM users WHERE name IN ('DBMARKER_XY7','CloudVerify','Probe','Live Verify');
