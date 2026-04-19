-- GDPR Art. 17 (right to erasure) + Art. 20 (portability) support.
-- deletion_requested_at puts the org into a 30-day grace window before the
-- scheduled purge. deletion_requested_by preserves who initiated it for the
-- audit log. A partial index keeps the pending-deletion query cheap.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS organizations_deletion_requested_idx
  ON public.organizations (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;

COMMENT ON COLUMN public.organizations.deletion_requested_at IS
  'When set, the organisation is scheduled for hard deletion 30 days later (GDPR Art. 17). Cleared when an admin cancels.';
COMMENT ON COLUMN public.organizations.deletion_requested_by IS
  'User who triggered the deletion. Kept for the audit trail.';
