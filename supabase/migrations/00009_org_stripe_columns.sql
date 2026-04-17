-- =========================================================================
-- 00009: Add Stripe billing columns to organizations
-- =========================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_period_end     timestamptz;

CREATE INDEX IF NOT EXISTS organizations_stripe_customer_id_idx
  ON public.organizations (stripe_customer_id);
