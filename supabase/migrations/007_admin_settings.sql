-- Ka Sari-Sari — App settings key/value store
-- Run after 006. Backs the admin Settings + WhatsApp config screens so saves
-- actually persist (previously the Save buttons hit a missing endpoint).

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;  -- server (service_role) only
GRANT ALL ON app_settings TO service_role;
