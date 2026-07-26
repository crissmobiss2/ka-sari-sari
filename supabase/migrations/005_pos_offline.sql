-- Ka Sari-Sari — Offline-first POS support
-- Run after 004_additional_tables.sql
--
-- Adds idempotency + device columns to pos_transactions and a single
-- record_pos_sale() function that inserts the sale AND decrements stock
-- atomically and exactly-once, keyed by the client-generated transaction id.
-- This lets an offline device queue sales locally and re-sync them safely:
-- replaying the same client_txn_id is a guaranteed no-op.

-- ── Columns ────────────────────────────────────────────────────────────────────
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_txn_id     UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS device_id         TEXT,
  ADD COLUMN IF NOT EXISTS client_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pos_retailer_created
  ON pos_transactions(retailer_id, created_at DESC);

-- ── Exactly-once sale recording ────────────────────────────────────────────────
-- Returns the canonical row. Safe to call repeatedly with the same
-- p_client_txn_id — stock is decremented only on the first successful insert.
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
  v_row  pos_transactions;
  v_item JSONB;
BEGIN
  -- Race-safe idempotency: only one concurrent caller wins the insert.
  INSERT INTO pos_transactions
    (client_txn_id, retailer_id, device_id, items, total,
     payment_method, payment_ref, pos_type, receipt_number, client_created_at)
  VALUES
    (p_client_txn_id, p_retailer_id, p_device_id, p_items, p_total,
     p_method, p_ref, p_pos_type, p_receipt, p_client_created_at)
  ON CONFLICT (client_txn_id) DO NOTHING
  RETURNING * INTO v_row;

  -- Conflict → this sale already landed. Return it, do NOT decrement again.
  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM pos_transactions WHERE client_txn_id = p_client_txn_id;
    RETURN v_row;
  END IF;

  -- First time only: decrement stock once per line item (atomic per row).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF (v_item->>'productId') IS NOT NULL THEN
      PERFORM adjust_stock(
        (v_item->>'productId'),
        -1 * GREATEST(1, COALESCE((v_item->>'qty')::int, 1))
      );
    END IF;
  END LOOP;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION record_pos_sale(
  UUID, UUID, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;
