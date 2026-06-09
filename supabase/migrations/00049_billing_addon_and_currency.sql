-- =============================================================================
-- 00049: AI Boost add-on flag + billing currency
--
-- Supports the optional "AI Boost" add-on (a second subscription line item that
-- raises the Copilot message allowance) and per-org billing currency
-- (EUR/CHF/GBP, resolved from the company country; the Stripe subscription's
-- currency is locked at first checkout).
-- =============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS ai_boost boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_currency text
    CHECK (billing_currency IN ('eur', 'chf', 'gbp'));

COMMENT ON COLUMN public.organizations.ai_boost IS
  'True when the AI Boost add-on is active on the subscription (extra Copilot '
  'message allowance). Set by the Stripe webhook from the subscription items.';
COMMENT ON COLUMN public.organizations.billing_currency IS
  'Currency of the active subscription (eur/chf/gbp), set from Stripe at '
  'checkout. Display falls back to the country-resolved currency when null.';
