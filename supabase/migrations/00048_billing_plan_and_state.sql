-- =============================================================================
-- 00048: Billing plan column + subscription-state columns
--
-- Reconciles a schema drift: the staging database was bootstrapped from a
-- squashed snapshot that included the organizations.stripe_* columns but
-- dropped `plan` (migration 00003 was never applied as a discrete step). With
-- no `plan` column, every plan read defaults to 'free' and the Stripe webhook's
-- UPDATE (which sets `plan`) is rejected wholesale — so a paid subscription
-- never reflects in the app.
--
-- This forward-only, idempotent migration guarantees the column exists, and
-- adds two columns the new in-app subscription management needs:
--   - billing_cancel_at_period_end : surfaces "your plan cancels on <date>"
--   - billing_interval             : 'monthly' | 'annual' for the active sub
-- =============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'professional', 'business', 'enterprise'));

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_cancel_at_period_end boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IN ('monthly', 'annual'));

COMMENT ON COLUMN public.organizations.plan IS
  'Active subscription tier (free/professional/business/enterprise). Set by the '
  'Stripe webhook from the subscription price; defaults to free.';
COMMENT ON COLUMN public.organizations.billing_cancel_at_period_end IS
  'True when the active subscription is set to cancel at billing_period_end '
  '(Stripe cancel_at_period_end). The plan stays active until then.';
COMMENT ON COLUMN public.organizations.billing_interval IS
  'Billing interval of the active subscription: monthly or annual.';
