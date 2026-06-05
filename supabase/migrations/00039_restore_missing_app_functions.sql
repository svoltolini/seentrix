-- =============================================================================
-- 00039: Restore app helper functions missing from non-production databases
--
-- These SECURITY DEFINER helpers existed on the original production database
-- (created before the migration files in this repo were the source of truth)
-- but were never captured as migrations. As a result a freshly-provisioned
-- database (e.g. the staging project) was missing them, which broke real
-- flows — most visibly onboarding: `create_org_and_user` calls
-- `set_user_org_claim` on its last line, so a missing function made the whole
-- RPC throw and the "Set up your company" form returned "Something went wrong".
--
-- All definitions below are copied verbatim from production. CREATE OR REPLACE
-- makes this migration idempotent and safe to run against a database that
-- already has them (production).
-- =============================================================================

-- Writes the org_id claim into the user's JWT app_metadata. Called by
-- create_org_and_user + accept_invite after the org row is created.
CREATE OR REPLACE FUNCTION public.set_user_org_claim(p_user_id uuid, p_org_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', p_org_id)
  where id = p_user_id;
end;
$function$;

-- Clears the must_complete_training gate once the Academy is finished —
-- updates both the public.users row and the JWT claim.
CREATE OR REPLACE FUNCTION public.clear_must_complete_training()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.users SET must_complete_training = false WHERE id = v_user_id;

  UPDATE auth.users
  SET raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('must_complete_training', false)
  WHERE id = v_user_id;
END;
$function$;

-- Atomic rate-limit counter increment (Upstash-independent DB fallback).
CREATE OR REPLACE FUNCTION public.increment_rate_limit_hits(p_key text, p_window_start timestamp with time zone)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  v_hits integer;
BEGIN
  INSERT INTO public.rate_limits (key, window_start, hits)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO v_hits;
  RETURN v_hits;
END;
$function$;

-- Scheduled cleanup of stale rate-limit rows.
CREATE OR REPLACE FUNCTION public.prune_rate_limits()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
$function$;

-- updated_at touch trigger fn for padaland_sessions.
CREATE OR REPLACE FUNCTION public.padaland_sessions_touch()
  RETURNS trigger
  LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

-- updated_at touch trigger fn for compliance_snapshots (referenced by the
-- ALTER in 00026 that was a no-op on databases lacking this function).
CREATE OR REPLACE FUNCTION public.tg_compliance_snapshots_touch_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
