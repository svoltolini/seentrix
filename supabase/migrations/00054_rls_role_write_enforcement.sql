-- =============================================================================
-- 00054: RLS role enforcement — viewers are read-only at the database layer
--
-- Until now, RLS only org-scoped writes; whether a role could write was
-- enforced solely in the server actions. If a future action forgets the
-- gate, the database wouldn't catch it. This adds a defense-in-depth
-- backstop: a SECURITY DEFINER helper that reads the caller's role, plus a
-- RESTRICTIVE write policy per core compliance table.
--
-- RESTRICTIVE policies combine with AND, so the existing permissive
-- org-scope policies are untouched — we simply additionally require the
-- caller to be a write role. Scoped TO authenticated, so anonymous public
-- intake (vulnerability reports, public DoC, advisories) is unaffected.
--
-- SELECT is never restricted: viewers can open and read everything; they
-- just cannot INSERT / UPDATE / DELETE. Tables written by SECURITY DEFINER
-- functions (compliance_snapshots) or by anonymous submitters are excluded,
-- as are per-user (academy, copilot) and admin-only (organizations, users,
-- invites) tables whose own gates are narrower than "can write".
-- =============================================================================

-- Caller's role is a write role? SECURITY DEFINER so it can read
-- public.users regardless of that table's own RLS.
CREATE OR REPLACE FUNCTION public.current_user_can_write()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'compliance_officer', 'cto', 'editor')
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_can_write() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_can_write() TO authenticated;

-- Apply the restrictive write backstop to every core compliance table.
DO $$
DECLARE
  t text;
  core_tables text[] := ARRAY[
    'products',
    'checklist_items',
    'product_checklist_item_comments',
    'documents',
    'product_conformity_steps',
    'product_conformity_step_comments',
    'product_conformity_step_attachments',
    'product_diagrams',
    'product_evidence',
    'product_releases',
    'risk_assessments',
    'risk_assessment_items',
    'sboms',
    'sbom_components',
    'vulnerabilities',
    'technical_files',
    'security_tests',
    'supply_chain_entries',
    'monitoring_entries',
    'entity_obligations',
    'incidents',
    'assessment_answers'
  ];
BEGIN
  FOREACH t IN ARRAY core_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_rw_ins', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.current_user_can_write())',
      t || '_rw_ins', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_rw_upd', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.current_user_can_write())',
      t || '_rw_upd', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_rw_del', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.current_user_can_write())',
      t || '_rw_del', t);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.current_user_can_write() IS
  'True when the caller (auth.uid()) has a write role (admin / compliance '
  'officer / CTO / editor). Backs the RESTRICTIVE write policies that make '
  'viewers read-only at the database layer.';
