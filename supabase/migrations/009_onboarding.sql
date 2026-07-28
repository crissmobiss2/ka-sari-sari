-- Ka Sari-Sari — Retailer Onboarding & KYC
-- Adds admin-reviewed verification + a full store-owner onboarding profile.
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

-- ── Verification status on users ─────────────────────────────────────────────
-- Existing accounts default to 'approved' so nobody currently live gets locked
-- out; new retailers are set to 'pending' at registration (in app code).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'approved'
    CHECK (verification_status IN ('pending','under_review','approved','rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes  TEXT,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_at        TIMESTAMPTZ;

-- ── Retailer onboarding profile (1:1 with users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS retailer_profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Owner identity (KYC)
  owner_full_name    VARCHAR(255),
  birthdate          DATE,
  id_type            VARCHAR(40),   -- philsys | drivers_license | umid | passport | sss | postal | voters
  id_number          VARCHAR(100),

  -- Store profile
  store_type         VARCHAR(40),   -- sari_sari | mini_mart | carinderia | grocery | other
  years_operating    INTEGER,
  store_size         VARCHAR(20),   -- small | medium | large
  operating_hours    VARCHAR(100),

  -- Location
  barangay           VARCHAR(255),
  landmark           VARCHAR(255),
  latitude           DECIMAL(10,7),
  longitude          DECIMAL(10,7),

  -- Business registration (optional — most micro stores are unregistered)
  dti_name           VARCHAR(255),
  permit_number      VARCHAR(100),
  tin                VARCHAR(40),

  -- Delivery preferences
  delivery_days      TEXT,          -- CSV e.g. "mon,wed,fri"
  delivery_window    VARCHAR(20),   -- morning | afternoon | evening | anytime
  alt_contact_name   VARCHAR(255),
  alt_contact_phone  VARCHAR(20),

  -- Financial profile (credit assessment)
  est_monthly_sales  DECIMAL(12,2),
  current_suppliers  TEXT,

  -- Consent (RA 10173 Data Privacy Act + Terms)
  privacy_consent    BOOLEAN DEFAULT FALSE,
  terms_accepted     BOOLEAN DEFAULT FALSE,
  marketing_opt_in   BOOLEAN DEFAULT FALSE,
  consent_at         TIMESTAMPTZ,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── KYC document uploads (paths into the private 'kyc' storage bucket) ────────
CREATE TABLE IF NOT EXISTS kyc_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  doc_type     VARCHAR(40) NOT NULL,   -- gov_id | selfie | storefront | permit
  storage_path TEXT NOT NULL,
  status       VARCHAR(20) DEFAULT 'submitted'
    CHECK (status IN ('submitted','approved','rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status)
  WHERE role = 'retailer';

-- Reload PostgREST schema cache so the new columns/tables are visible to the API.
NOTIFY pgrst, 'reload schema';
