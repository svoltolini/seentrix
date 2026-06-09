-- =============================================================================
-- 00051: Per-org Copilot usage aggregation (admin console)
--
-- The admin "Usage & AI margin" view needs token totals per organisation.
-- chat_messages has no org_id (it's reached through chat_sessions), and
-- summing potentially-large message sets in the app is wasteful, so we do the
-- group-by in Postgres.
--
-- SECURITY DEFINER + a locked search_path so the service role can call it; we
-- revoke EXECUTE from anon/authenticated so no customer session can ever reach
-- cross-org usage through it.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_usage_by_org(since timestamptz)
RETURNS TABLE (
  org_id        uuid,
  message_count bigint,
  tokens_in     bigint,
  tokens_out    bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.org_id,
    count(*) FILTER (WHERE m.role = 'assistant')      AS message_count,
    coalesce(sum(m.token_usage_in), 0)                AS tokens_in,
    coalesce(sum(m.token_usage_out), 0)               AS tokens_out
  FROM public.chat_messages m
  JOIN public.chat_sessions s ON s.id = m.session_id
  WHERE m.created_at >= since
  GROUP BY s.org_id;
$$;

REVOKE ALL ON FUNCTION public.admin_usage_by_org(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_usage_by_org(timestamptz) FROM anon, authenticated;

COMMENT ON FUNCTION public.admin_usage_by_org(timestamptz) IS
  'Admin-only: per-org Copilot token totals since a timestamp. Service-role only.';
