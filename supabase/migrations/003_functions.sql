-- Ka Sari-Sari — Database Functions
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- ── Wallet Functions ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET wallet_balance = wallet_balance + p_amount, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO wallet_transactions(user_id, type, amount, description, reference_id, status)
  VALUES (p_user_id, 'credit', p_amount, p_description, p_reference_id, 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT wallet_balance FROM users WHERE id = p_user_id) < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE users SET wallet_balance = wallet_balance - p_amount, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO wallet_transactions(user_id, type, amount, description, reference_id, status)
  VALUES (p_user_id, 'debit', p_amount, p_description, p_reference_id, 'completed');
END;
$$;

-- ── Loyalty Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET loyalty_points = loyalty_points + p_points, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ── Stock Adjustment ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id VARCHAR,
  p_delta INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
  SET stock_qty = GREATEST(0, stock_qty + p_delta), updated_at = NOW()
  WHERE id = p_product_id;
END;
$$;

-- ── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Order Number Generator ────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS order_seq START 1000;

CREATE OR REPLACE FUNCTION next_order_number() RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'KSS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_seq')::TEXT, 5, '0');
$$;
