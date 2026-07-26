-- Ka Sari-Sari — Driver/profile fields on users
-- The app reads/writes users.vehicle_plate, vehicle_type, area (admin driver
-- list + create) and gcash_number (driver profile), but the original schema
-- never defined them — so /api/admin/drivers errored against Postgres and
-- dispatch could not assign a driver. Add the missing columns.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type  TEXT,
  ADD COLUMN IF NOT EXISTS area          TEXT,
  ADD COLUMN IF NOT EXISTS gcash_number  TEXT;
