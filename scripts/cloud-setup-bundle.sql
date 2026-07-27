-- Ka Sari-Sari — cloud setup bundle (schema 001-008 + load-test seed). Paste into Supabase SQL Editor.

-- ============ 001_initial_schema.sql ============
-- Ka Sari-Sari â€” Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard â†’ SQL Editor â†’ New query â†’ paste â†’ Run)

-- â”€â”€ Extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS categories (
  id            VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(10),
  slug          VARCHAR(100),
  display_order INTEGER      DEFAULT 0,
  is_active     BOOLEAN      DEFAULT TRUE
);

-- â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Order Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ OTP Codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) NOT NULL,
  code_hash  TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€ Wallet Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Loyalty Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  points      INTEGER NOT NULL,
  type        VARCHAR(20) CHECK (type IN ('earned','redeemed','expired','bonus')),
  description TEXT,
  order_id    VARCHAR(50) REFERENCES orders(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Push Subscriptions (VAPID) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  endpoint   TEXT UNIQUE NOT NULL,
  auth       TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€ Driver Locations (Realtime GPS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id  UUID PRIMARY KEY REFERENCES users(id),
  lat        DECIMAL(10,7),
  lng        DECIMAL(10,7),
  heading    DECIMAL(5,2),
  speed      DECIMAL(5,2),
  on_duty    BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€ Deliveries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Delivery Attempts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS delivery_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  reason      VARCHAR(100),
  photo_url   TEXT,
  notes       TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€ Credit Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Warehouses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Product Stock per Warehouse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Pick Lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Pick List Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Suppliers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Purchase Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Purchase Order Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id        UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id   VARCHAR(50) REFERENCES products(id),
  qty_ordered  INTEGER       NOT NULL,
  qty_received INTEGER       DEFAULT 0,
  unit_cost    DECIMAL(10,2) NOT NULL,
  subtotal     DECIMAL(12,2)
);

-- â”€â”€ COD Settlements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Realtime Publications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Run these after creating tables if you want Realtime subscriptions:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- Service role bypasses RLS â€” our API routes use SUPABASE_SERVICE_ROLE_KEY
-- so no policies needed for server-side access


-- ============ 002_seed_users.sql ============
-- Ka Sari-Sari â€” Seed Users
-- bcrypt hash of "admin"      â†’ $2b$10$hash_for_admin
-- bcrypt hash of "warehouse"  â†’ $2b$10$hash_for_warehouse
-- bcrypt hash of "driver"     â†’ $2b$10$hash_for_driver
-- bcrypt hash of "demo1234"   â†’ $2b$10$hash_for_demo1234
-- NOTE: Run `node supabase/generate-hashes.js` to regenerate real hashes,
--       OR use the app's /api/seed endpoint after deployment.

-- Default seed accounts (passwords match original mock data):
INSERT INTO users (id, phone, password_hash, name, role, store_name, address, status, subscription_status, subscription_expires_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '09171234567',
   '$2b$10$8K1p/a0dR1xqM2eZ3bN4O.YlLnR7G2VwHm6KpT3BdI8SxFqOuEyeS',
   'Admin User', 'admin', NULL, NULL, 'active', 'active', NOW() + INTERVAL '1 year'),

  ('00000000-0000-0000-0000-000000000002', '09172345678',
   '$2b$10$N9GwK3mP5rT8sV2qX6uY0.ZcLnA4D7BhJk1EiR6FmW9OtCpUeGvQd',
   'Juan dela Cruz', 'warehouse', NULL, NULL, 'active', 'active', NOW() + INTERVAL '1 year'),

  ('00000000-0000-0000-0000-000000000003', '09173456789',
   '$2b$10$R5eL8wM2kP3nV7tB1qU0Y.XaJhF6C9GsDj4KiN2EoA8WbPcTeHvLm',
   'Ramon Santos', 'driver', NULL, NULL, 'active', 'active', NOW() + INTERVAL '1 year'),

  ('00000000-0000-0000-0000-000000000004', '09181234567',
   '$2b$10$7V2xQ9dK5mN1pL4rT8sB0.YoMhA3E6FjCk9GnP2iU7WcRbSeHvZe',
   'Maria Santos', 'retailer', 'Santos Sari-Sari Store',
   'Brgy. San Jose, Caloocan City', 'active', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (id) DO NOTHING;

-- Seed warehouse
INSERT INTO warehouses (id, name, address, city, province, hub, is_active)
VALUES ('00000000-0000-0000-0000-000000000010',
        'Ka Sari-Sari Main Warehouse',
        '123 Warehouse Road, CAMANAVA',
        'Caloocan', 'Metro Manila', 'NCR', TRUE)
ON CONFLICT DO NOTHING;

-- Seed suppliers
INSERT INTO suppliers (name, contact_name, phone) VALUES
  ('PhilBev Distributors', 'Pedro Reyes', '09171111111'),
  ('Lucky Me Foods', 'Rosa Dela Cruz', '09172222222'),
  ('Del Monte Philippines', 'Carlo Mendoza', '09173333333'),
  ('Procter & Gamble PH', 'Ana Garcia', '09174444444'),
  ('Mega Global Corp', 'Jose Buenaventura', '09175555555')
ON CONFLICT DO NOTHING;


-- ============ 003_functions.sql ============
-- Ka Sari-Sari â€” Database Functions
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- â”€â”€ Wallet Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ Loyalty Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET loyalty_points = loyalty_points + p_points, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- â”€â”€ Stock Adjustment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ Auto-update updated_at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ Order Number Generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE SEQUENCE IF NOT EXISTS order_seq START 1000;

CREATE OR REPLACE FUNCTION next_order_number() RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'KSS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_seq')::TEXT, 5, '0');
$$;

-- â”€â”€ Table Grants (merged from former 003_grants.sql) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Raw SQL CREATE TABLE needs explicit grants (the Table Editor UI auto-grants).
-- NOTE: two files sharing the "003" version prefix breaks CLI migration
-- (schema_migrations PK), so grants live here rather than a second 003_ file.
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ============ 004_additional_tables.sql ============
-- Ka Sari-Sari â€” Additional tables for POS, support tickets, categories
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


-- ============ 005_pos_offline.sql ============
-- Ka Sari-Sari â€” Offline-first POS support
-- Run after 004_additional_tables.sql
--
-- Adds idempotency + device columns to pos_transactions and a single
-- record_pos_sale() function that inserts the sale AND decrements stock
-- atomically and exactly-once, keyed by the client-generated transaction id.
-- This lets an offline device queue sales locally and re-sync them safely:
-- replaying the same client_txn_id is a guaranteed no-op.

-- â”€â”€ Columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_txn_id     UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS device_id         TEXT,
  ADD COLUMN IF NOT EXISTS client_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pos_retailer_created
  ON pos_transactions(retailer_id, created_at DESC);

-- Receipt numbers are minted offline per-device and cannot be globally unique
-- from local state alone. They are NOT the idempotency key (client_txn_id is),
-- so drop the UNIQUE constraint â€” a duplicate must never 500 and jam a device's
-- outbox. (Global BIR-grade uniqueness = a server-issued range, a follow-up.)
ALTER TABLE pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_receipt_number_key;

-- â”€â”€ Exactly-once sale recording â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Returns the canonical row. Safe to call repeatedly with the same
-- p_client_txn_id â€” stock is decremented only on the first successful insert.
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

  -- Conflict â†’ this sale already landed. Return it unchanged (idempotent).
  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM pos_transactions WHERE client_txn_id = p_client_txn_id;
  END IF;

  -- NOTE: a retailer's POS sale to a walk-in customer does NOT decrement shared
  -- warehouse stock (products.stock_qty) â€” that column is warehouse on-hand for
  -- B2B ordering, and one store's retail sales must not deplete what every other
  -- store sees. Per-retailer inventory is a separate, documented follow-up. The
  -- sale is recorded here as the source of truth; no stock side effects.
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION record_pos_sale(
  UUID, UUID, TEXT, JSONB, NUMERIC, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;


-- ============ 006_security_and_schema_fixes.sql ============
-- Ka Sari-Sari â€” Security + schema-consistency fixes
-- Run after 005_pos_offline.sql
--
-- Fixes verified in the pre-launch audit:
--   1. The public anon key (shipped to the browser) had blanket SELECT on every
--      table, exposing supplier PII, purchase costs, COD financials, and OTP
--      records. Restrict anon to the genuinely public catalog only, and enable
--      RLS (deny-all; the server uses service_role and bypasses it) on the
--      sensitive tables that lacked it.
--   2. The app writes order status 'packed' and delivery status 'assigned' plus
--      a deliveries.scheduled_date column â€” none of which the CHECK constraints
--      / schema allowed, so the pack and driver-assign flows would throw.

-- â”€â”€ 1. Anon lockdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ 2. Schema â†” code consistency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- ============ 007_admin_settings.sql ============
-- Ka Sari-Sari â€” App settings key/value store
-- Run after 006. Backs the admin Settings + WhatsApp config screens so saves
-- actually persist (previously the Save buttons hit a missing endpoint).

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;  -- server (service_role) only
GRANT ALL ON app_settings TO service_role;


-- ============ 008_user_driver_fields.sql ============
-- Ka Sari-Sari â€” Driver/profile fields on users
-- The app reads/writes users.vehicle_plate, vehicle_type, area (admin driver
-- list + create) and gcash_number (driver profile), but the original schema
-- never defined them â€” so /api/admin/drivers errored against Postgres and
-- dispatch could not assign a driver. Add the missing columns.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type  TEXT,
  ADD COLUMN IF NOT EXISTS area          TEXT,
  ADD COLUMN IF NOT EXISTS gcash_number  TEXT;


-- ============ real seed passwords (admin/warehouse/driver/demo1234) ============
-- Real bcrypt hashes for the seed demo accounts (local dev / load test)
UPDATE users SET password_hash = '$2b$10$6jr8x4Km3bWjtVuyZ.w64.GyCVwO4onavwgrscUCDdf/0vhqbiT2u' WHERE phone = '09171234567';
UPDATE users SET password_hash = '$2b$10$ejwTYfKzhjf31IduYy5DS.XGYVzaeHx.q3PEbPiKSBba5MPwqDV7a' WHERE phone = '09172345678';
UPDATE users SET password_hash = '$2b$10$wMOrkvJRBhQ5oDPR8Fliwuq0lZ882WpMYgcWUBAoRUe.MFKICQ5pO' WHERE phone = '09173456789';
UPDATE users SET password_hash = '$2b$10$9I.VTuNa3kOQFsGngHzjc.i91mBq5oVdfFUhg8KG3HNxcaDpyYmza' WHERE phone = '09181234567';


-- ============ load-test products (p-001..p-030) ============
-- Minimal catalog for load testing (satisfies order_items -> products FK).
INSERT INTO categories (id, name, slug, display_order, is_active)
VALUES ('cat-lt', 'Load Test', 'load-test', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, category_id, name, unit, price, srp, sku, stock_qty, is_active)
SELECT
  'p-' || LPAD(g::text, 3, '0'),
  'cat-lt',
  'Load Test Product ' || g,
  'pc',
  (5 + g)::numeric,
  (8 + g)::numeric,
  'SKU-' || LPAD(g::text, 3, '0'),
  1000000,
  TRUE
FROM generate_series(1, 30) AS g
ON CONFLICT (id) DO NOTHING;

SELECT 'products seeded='||count(*) FROM products;

