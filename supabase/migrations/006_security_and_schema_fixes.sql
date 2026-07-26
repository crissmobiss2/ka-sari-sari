-- Ka Sari-Sari — Security + schema-consistency fixes
-- Run after 005_pos_offline.sql
--
-- Fixes verified in the pre-launch audit:
--   1. The public anon key (shipped to the browser) had blanket SELECT on every
--      table, exposing supplier PII, purchase costs, COD financials, and OTP
--      records. Restrict anon to the genuinely public catalog only, and enable
--      RLS (deny-all; the server uses service_role and bypasses it) on the
--      sensitive tables that lacked it.
--   2. The app writes order status 'packed' and delivery status 'assigned' plus
--      a deliveries.scheduled_date column — none of which the CHECK constraints
--      / schema allowed, so the pack and driver-assign flows would throw.

-- ── 1. Anon lockdown ───────────────────────────────────────────────────────────
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON categories, products TO anon;

-- Defense in depth: enable RLS (no policy = deny-all for anon/authenticated;
-- service_role still has full access) on tables that were left unprotected.
ALTER TABLE otp_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_settlements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock        ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_attempts    ENABLE ROW LEVEL SECURITY;

-- ── 2. Schema ↔ code consistency ───────────────────────────────────────────────
-- orders.status needs 'packed' (written by mark_packed).
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending','confirmed','picking','picked','packed',
             'dispatched','out_for_delivery','delivered','failed','cancelled')
);

-- deliveries.status needs 'assigned'; add the scheduled_date the code writes.
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (
  status IN ('pending','assigned','en_route','arrived','delivered','failed','returned')
);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;
