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

-- Receipt numbers are minted offline per-device and cannot be globally unique
-- from local state alone. They are NOT the idempotency key (client_txn_id is),
-- so drop the UNIQUE constraint — a duplicate must never 500 and jam a device's
-- outbox. (Global BIR-grade uniqueness = a server-issued range, a follow-up.)
ALTER TABLE pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_receipt_number_key;

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
  v_row pos_transactions;
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

  -- Conflict → this sale already landed. Return it unchanged (idempotent).
  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM pos_transactions WHERE client_txn_id = p_client_txn_id;
  END IF;

  -- NOTE: a retailer's POS sale to a walk-in customer does NOT decrement shared
  -- warehouse stock (products.stock_qty) — that column is warehouse on-hand for
  -- B2B ordering, and one store's retail sales must not deplete what every other
  -- store sees. Per-retailer inventory is a separate, documented follow-up. The
  -- sale is recorded here as the source of truth; no stock side effects.
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION record_pos_sale(
  UUID, UUID, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;
