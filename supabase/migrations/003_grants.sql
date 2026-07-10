-- Ka Sari-Sari — Table Grants
-- Run this after 001_initial_schema.sql when tables were created via SQL editor.
-- Supabase auto-grants when using the Table Editor UI, but raw SQL CREATE TABLE
-- statements require explicit grants.

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
