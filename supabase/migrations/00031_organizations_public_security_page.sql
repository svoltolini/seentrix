-- =============================================================================
-- 00031: Restore the public security page + PSIRT intake for anon users
--
-- The /security/[slug] page and the submitPublicReport server action both
-- SELECT from public.organizations before asking the user to submit a
-- vulnerability report. Without an anon SELECT policy those calls return
-- null and the whole PSIRT flow fails for the exact audience it was built
-- for — unauthenticated reporters.
--
-- This policy is narrow by design: anon can only see orgs that have
-- explicitly opted-in by flipping security_public_enabled = true, and only
-- the columns the public page needs (enforced at the query layer — RLS
-- doesn't do column-level filtering). The existing authed-org policy still
-- covers the broader SELECT case.
-- =============================================================================

CREATE POLICY "organizations_public_security_page"
  ON public.organizations
  FOR SELECT
  TO anon
  USING (security_public_enabled = true);
