-- =============================================================================
-- 00050: Platform staff + admin audit log
--
-- Foundation for the internal Seentrix back-office console (/app/admin/*).
--
--   * platform_staff — the allowlist of Seentrix employees who may use the
--     cross-tenant admin console. This is DELIBERATELY separate from the
--     org-level `users.role` ('admin' etc.): an org admin manages their own
--     company; platform staff see every company. Membership here is the only
--     thing that unlocks the console.
--
--   * admin_audit — an append-only record of every action a staff member
--     takes in the console (viewing a customer, issuing a refund, granting an
--     add-on, impersonating, …). The console reads customer data via the
--     service role, so this log is how we keep that power accountable.
--
-- Both tables have RLS enabled with NO policies, so they are reachable only
-- via the service-role key on the server — never from a browser session.
-- =============================================================================

-- --- platform_staff ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_staff (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email       text NOT NULL,
  -- 'owner' can manage the staff list + perform destructive overrides;
  -- 'staff' has read + standard support actions. Enforced in app code.
  role        text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.platform_staff ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: service-role only.

COMMENT ON TABLE public.platform_staff IS
  'Seentrix employees allowed into the internal admin console. Separate from '
  'org-level users.role. Service-role access only (RLS enabled, no policies).';

-- --- admin_audit -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid NOT NULL,
  actor_email   text NOT NULL,
  -- entity.verb, e.g. 'org.viewed', 'billing.refunded', 'org.impersonated'.
  action        text NOT NULL,
  target_type   text,
  target_id     text,
  -- Denormalised so we can filter "everything done to org X" cheaply.
  target_org_id uuid,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: service-role only.

CREATE INDEX IF NOT EXISTS admin_audit_created_at_idx
  ON public.admin_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_target_org_idx
  ON public.admin_audit (target_org_id, created_at DESC);

COMMENT ON TABLE public.admin_audit IS
  'Append-only log of every action taken in the internal admin console. '
  'Service-role access only (RLS enabled, no policies).';
