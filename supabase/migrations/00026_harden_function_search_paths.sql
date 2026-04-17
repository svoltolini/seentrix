-- =============================================================================
-- 00026: Harden search_path on the trigger functions added in 18–25
-- Supabase's security linter (0011_function_search_path_mutable) flags any
-- function without a pinned search_path. Pinning to `public` prevents a
-- privileged caller from resolving schema objects to a hostile shadow schema.
-- =============================================================================

ALTER FUNCTION public.tg_compliance_snapshots_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.upsert_compliance_snapshot()               SET search_path = public;
ALTER FUNCTION public.tg_incidents_touch_updated_at()            SET search_path = public;
ALTER FUNCTION public.tg_conformity_touch_updated_at()           SET search_path = public;
ALTER FUNCTION public.tg_vuln_reports_touch_updated_at()         SET search_path = public;
ALTER FUNCTION public.tg_entity_obligations_touch_updated_at()   SET search_path = public;
