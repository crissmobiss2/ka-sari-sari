-- Ka Sari-Sari — Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        VARCHAR(20)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('retailer','admin','warehouse','driver')),
  store_name    VARCHAR(255),
  address       TEXT,
  city          VARCHAR(100),
  province      VARCHAR(100),
  status        VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  credit_limit        DECIMAL(12,2) DEFAULT 0,
  credit_terms        INTEGER       DEFAULT 0,   -- days net payment
  subscription_status VARCHAR(20)  DEFAULT 'inactive',
  subscription_expires_at TIMESTAMPTZ,
  loyalty_points  INTEGER      DEFAULT 0,
  wallet_balance  DECIMAL(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(10),
  slug          VARCHAR(100),
  display_order INTEGER      DEFAULT 0,
  is_active     BOOLEAN      DEFAULT TRUE
);

-- ── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  VARCHAR(50) PRIMARY KEY,
  category_id         VARCHAR(20) REFERENCES categories(id),
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(255),
  brand               VARCHAR(100),
  unit                VARCHAR(50),
  unit_size           VARCHAR(50),
  price               DECIMAL(10,2) NOT NULL,
  srp                 DECIMAL(10,2),
  sku                 VARCHAR(100),
  barcode             VARCHAR(100),
  min_order_qty       INTEGER DEFAULT 1,
  is_active           BOOLEAN DEFAULT TRUE,
  is_featured         BOOLEAN DEFAULT FALSE,
  stock_qty           INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  reorder_point       INTEGER DEFAULT 20,
  image_url           TEXT,
  description         TEXT,
  weight_grams        INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    VARCHAR(50) PRIMARY KEY,
  order_number          VARCHAR(50) UNIQUE,
  retailer_id           UUID REFERENCES users(id),
  status                VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','picking','picked','dispatched','out_for_delivery','delivered','failed','cancelled')),
  subtotal              DECIMAL(12,2) NOT NULL,
  delivery_fee          DECIMAL(10,2) DEFAULT 0,
  discount              DECIMAL(10,2) DEFAULT 0,
  total                 DECIMAL(12,2) NOT NULL,
  payment_method        VARCHAR(30),
  payment_status        VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_intent_id     TEXT,
  delivery_address      TEXT,
  delivery_city         VARCHAR(100),
  notes                 TEXT,
  driver_id             UUID REFERENCES users(id),
  estimated_delivery_at TIMESTAMPTZ,
  confirmed_at          TIMESTAMPTZ,
  dispatched_at         TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Order Items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  product_id    VARCHAR(50) REFERENCES products(id),
  product_name  VARCHAR(255),
  product_image TEXT,
  qty           INTEGER       NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(12,2) NOT NULL
);

-- ── OTP Codes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) NOT NULL,
  code_hash  TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Wallet Transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  type         VARCHAR(20) NOT NULL CHECK (type IN ('credit','debit')),
  amount       DECIMAL(12,2) NOT NULL,
  description  TEXT,
  reference_id TEXT,
  status       VARCHAR(20) DEFAULT 'completed',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Loyalty Transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  points      INTEGER NOT NULL,
  type        VARCHAR(20) CHECK (type IN ('earned','redeemed','expired','bonus')),
  description TEXT,
  order_id    VARCHAR(50) REFERENCES orders(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  type       VARCHAR(50),
  is_read    BOOLEAN DEFAULT FALSE,
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Push Subscriptions (VAPID) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  endpoint   TEXT UNIQUE NOT NULL,
  auth       TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Driver Locations (Realtime GPS) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id  UUID PRIMARY KEY REFERENCES users(id),
  lat        DECIMAL(10,7),
  lng        DECIMAL(10,7),
  heading    DECIMAL(5,2),
  speed      DECIMAL(5,2),
  on_duty    BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Deliveries ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       VARCHAR(50) REFERENCES orders(id),
  driver_id      UUID REFERENCES users(id),
  route_position INTEGER,
  status         VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending','en_route','arrived','delivered','failed','returned')),
  cod_amount     DECIMAL(12,2) DEFAULT 0,
  cod_collected  DECIMAL(12,2),
  proof_photo_url TEXT,
  signature_url  TEXT,
  recipient_name VARCHAR(255),
  notes          TEXT,
  lat            DECIMAL(10,7),
  lng            DECIMAL(10,7),
  attempted_at   TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ
);

-- ── Delivery Attempts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  reason      VARCHAR(100),
  photo_url   TEXT,
  notes       TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Credit Applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id      UUID REFERENCES users(id),
  requested_limit  DECIMAL(12,2),
  requested_terms  INTEGER DEFAULT 7,
  status           VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved','rejected')),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  approved_limit   DECIMAL(12,2),
  approved_terms   INTEGER,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Warehouses ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  address    TEXT,
  city       VARCHAR(100),
  province   VARCHAR(100),
  hub        VARCHAR(50),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Product Stock per Warehouse ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_stock (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   VARCHAR(50) REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  qty          INTEGER DEFAULT 0,
  reserved_qty INTEGER DEFAULT 0,
  bin_location VARCHAR(50),
  lot_number   VARCHAR(100),
  expires_at   DATE,
  received_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id, lot_number)
);

-- ── Pick Lists ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pick_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     VARCHAR(50) REFERENCES orders(id),
  warehouse_id UUID REFERENCES warehouses(id),
  assigned_to  UUID REFERENCES users(id),
  status       VARCHAR(20) DEFAULT 'open'
    CHECK (status IN ('open','in_progress','completed','cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ── Pick List Items ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pick_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_list_id  UUID REFERENCES pick_lists(id) ON DELETE CASCADE,
  product_id    VARCHAR(50) REFERENCES products(id),
  product_name  VARCHAR(255),
  qty_required  INTEGER NOT NULL,
  qty_picked    INTEGER DEFAULT 0,
  bin_location  VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','picked','short','substituted')),
  picked_at     TIMESTAMPTZ
);

-- ── Suppliers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email        VARCHAR(255),
  phone        VARCHAR(20),
  address      TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Purchase Orders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number    VARCHAR(50) UNIQUE,
  supplier_id  UUID REFERENCES suppliers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  status       VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft','sent','confirmed','receiving','received','cancelled')),
  total        DECIMAL(12,2) DEFAULT 0,
  created_by   UUID REFERENCES users(id),
  notes        TEXT,
  expected_at  DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Purchase Order Items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id        UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id   VARCHAR(50) REFERENCES products(id),
  qty_ordered  INTEGER       NOT NULL,
  qty_received INTEGER       DEFAULT 0,
  unit_cost    DECIMAL(10,2) NOT NULL,
  subtotal     DECIMAL(12,2)
);

-- ── COD Settlements ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cod_settlements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID REFERENCES users(id),
  date            DATE NOT NULL,
  total_collected DECIMAL(12,2) DEFAULT 0,
  total_expected  DECIMAL(12,2) DEFAULT 0,
  variance        DECIMAL(12,2) DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','verified','settled')),
  submitted_at    TIMESTAMPTZ,
  verified_by     UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_retailer  ON orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver    ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active, category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock    ON products(stock_qty);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_user      ON loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_user       ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_phone         ON otp_codes(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_pick_lists_order  ON pick_lists(order_id);

-- ── Realtime Publications ────────────────────────────────────────────────────
-- Run these after creating tables if you want Realtime subscriptions:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on all tables (access controlled via service role in API routes)
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_lists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_list_items    ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — our API routes use SUPABASE_SERVICE_ROLE_KEY
-- so no policies needed for server-side access
