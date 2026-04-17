-- =============================================================================
-- 00027: Advisor hardening
-- Addresses the Supabase security + performance linter warnings surfaced
-- after the phase 1-6 migrations. Three things:
--   1. Pin search_path on the last unpinned helper.
--   2. Add covering indexes for 11 unindexed foreign keys.
--   3. Rewrite every RLS policy in the public schema that calls auth.jwt()
--      per-row so the expression is wrapped in (SELECT auth.jwt()) — the
--      Postgres initplan cache then evaluates it once per query instead of
--      once per row. Supabase's auth_rls_initplan check flagged 61 of these.
--   4. Tighten the newsletter_subscribers anon-insert policy so its WITH
--      CHECK does real validation instead of `true`.
-- =============================================================================

-- 1. Pin search_path on the pre-existing helper
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 2. Covering indexes for all remaining unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessed_by
  ON public.assessment_answers (assessed_by)
  WHERE assessed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_items_assigned_to
  ON public.checklist_items (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_obligations_completed_by
  ON public.entity_obligations (completed_by)
  WHERE completed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_created_by
  ON public.incidents (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invites_accepted_by
  ON public.invites (accepted_by)
  WHERE accepted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invites_created_by
  ON public.invites (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_conformity_steps_completed_by
  ON public.product_conformity_steps (completed_by)
  WHERE completed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_releases_created_by
  ON public.product_releases (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_resolved_by
  ON public.vulnerabilities (resolved_by)
  WHERE resolved_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vulnerability_reports_assigned_to
  ON public.vulnerability_reports (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vulnerability_reports_linked_vulnerability
  ON public.vulnerability_reports (linked_vulnerability_id)
  WHERE linked_vulnerability_id IS NOT NULL;

-- 3. Wrap every inline auth.jwt() call in (SELECT auth.jwt()) so it runs
-- once per query instead of once per row. Idempotent: skips policies that
-- have already been rewritten (their qual/with_check contains
-- 'SELECT auth.jwt()').
DO $$
DECLARE
  rec RECORD;
  new_qual text;
  new_with_check text;
BEGIN
  FOR rec IN
    SELECT policyname, tablename, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual       LIKE '%auth.jwt()%' AND qual       NOT LIKE '%SELECT auth.jwt()%')
        OR
        (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%SELECT auth.jwt()%')
      )
  LOOP
    new_qual := CASE
      WHEN rec.qual IS NULL THEN NULL
      ELSE replace(rec.qual, 'auth.jwt()', '(SELECT auth.jwt())')
    END;
    new_with_check := CASE
      WHEN rec.with_check IS NULL THEN NULL
      ELSE replace(rec.with_check, 'auth.jwt()', '(SELECT auth.jwt())')
    END;

    IF new_qual IS NOT NULL AND new_with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)',
        rec.policyname, rec.tablename, new_qual, new_with_check
      );
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (%s)',
        rec.policyname, rec.tablename, new_qual
      );
    ELSIF new_with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I WITH CHECK (%s)',
        rec.policyname, rec.tablename, new_with_check
      );
    END IF;
  END LOOP;
END$$;

-- 4. Replace the newsletter_subscribers anon-insert policy's blanket
-- WITH CHECK (true) with a real validation. Keeps the landing-page form
-- working (emails from signups are still accepted) while refusing empty,
-- overly long, or obviously malformed submissions.
ALTER POLICY "anon_insert" ON public.newsletter_subscribers
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 254
    AND email LIKE '%@%.%'
    AND (locale IS NULL OR locale IN ('en', 'de'))
    AND (source IS NULL OR length(source) <= 64)
  );
