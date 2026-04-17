-- =============================================================================
-- 00032: Add WITH CHECK to every UPDATE policy in the public schema
--
-- The original policies only set USING (org_id = <caller>). That gates *who
-- can update the row*, but not *what the row looks like afterwards*. In
-- principle a user could UPDATE their own row SET org_id = '<victim>', and
-- Postgres would accept it — the row passes USING because it's theirs at
-- read time, and WITH CHECK is the only thing that would stop it from
-- landing in another org. No current server action exposes org_id in an
-- update payload, so this isn't exploitable today, but it's a fragile
-- foundation. This migration copies each UPDATE policy's USING clause into
-- WITH CHECK so the guard is symmetric.
--
-- Idempotent: skips policies that already have a WITH CHECK set.
-- =============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT policyname, tablename, qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'UPDATE'
      AND qual IS NOT NULL
      AND with_check IS NULL
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)',
      rec.policyname,
      rec.tablename,
      rec.qual,
      rec.qual
    );
  END LOOP;
END$$;
