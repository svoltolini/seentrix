-- =============================================================================
-- 00029: Company profile fields required for CRA document generation
-- The Declaration of Conformity (Annex V) and Technical Documentation (Annex II)
-- need the manufacturer's legal identity. These columns live on the
-- organizations row so they're reused across every document.
-- =============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_name           text,
  ADD COLUMN IF NOT EXISTS registration_number  text,
  ADD COLUMN IF NOT EXISTS signatory_name       text,
  ADD COLUMN IF NOT EXISTS signatory_position   text,
  ADD COLUMN IF NOT EXISTS contact_email        text,
  ADD COLUMN IF NOT EXISTS website              text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- The onboarding wizard flips this to true once the three-step flow is done.
-- The middleware already reroutes anyone without an org_id to /auth/onboarding,
-- so this flag mostly helps the backend gate document issuance and show a
-- "finish company setup" banner on the dashboard.

COMMENT ON COLUMN public.organizations.legal_name IS
  'Registered legal entity name. May differ from display `name`. Required for CRA DoC.';
COMMENT ON COLUMN public.organizations.registration_number IS
  'VAT / trade-register / HRB number. Required for unambiguous manufacturer ID on CRA DoC.';
COMMENT ON COLUMN public.organizations.signatory_name IS
  'Natural person who signs the Declaration of Conformity.';
COMMENT ON COLUMN public.organizations.signatory_position IS
  'Job title of the signatory (CEO, CTO, Compliance Officer, etc.).';
COMMENT ON COLUMN public.organizations.contact_email IS
  'Public customer-facing contact email. Separate from security_contact_email.';
