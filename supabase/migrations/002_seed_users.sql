-- Ka Sari-Sari — Seed Users
-- bcrypt hash of "admin"      → $2b$10$hash_for_admin
-- bcrypt hash of "warehouse"  → $2b$10$hash_for_warehouse
-- bcrypt hash of "driver"     → $2b$10$hash_for_driver
-- bcrypt hash of "demo1234"   → $2b$10$hash_for_demo1234
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
