-- =========================================================================
-- 00014: Invites table + accept_invite / get_invite_info RPCs
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Invites table
-- ---------------------------------------------------------------------------
CREATE TABLE public.invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email       text,
  role        text NOT NULL DEFAULT 'viewer'
              CHECK (role IN ('admin','compliance_officer','cto','viewer','editor')),
  token       text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invites_org_id_idx ON public.invites (org_id);
CREATE INDEX invites_token_idx  ON public.invites (token);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Org members can view their own org's invites
CREATE POLICY "invites_select" ON public.invites
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Org members can create invites for their own org
CREATE POLICY "invites_insert" ON public.invites
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Org members can delete (revoke) invites for their own org
CREATE POLICY "invites_delete" ON public.invites
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Org members can update invites for their own org (for accept flow via RPC)
CREATE POLICY "invites_update" ON public.invites
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- 2. Helper: is_org_admin — checks if the current user is an admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. get_invite_info — public RPC to show invite details on signup page
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_invite_info(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invite record;
  v_org_name text;
BEGIN
  SELECT i.org_id, i.role, i.email, i.expires_at, i.accepted_at
  INTO v_invite
  FROM public.invites i
  WHERE i.token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = v_invite.org_id;

  RETURN jsonb_build_object(
    'valid', true,
    'org_name', v_org_name,
    'role', v_invite.role,
    'email', v_invite.email
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. accept_invite — called during onboarding for invited users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invite(
  p_token text,
  p_full_name text,
  p_email text,
  p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id    uuid;
  v_invite     record;
  v_user_count integer;
  v_plan       text;
  v_user_limit integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent double-onboarding
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User already onboarded';
  END IF;

  -- Find the invite
  SELECT i.id, i.org_id, i.role, i.expires_at, i.accepted_at
  INTO v_invite
  FROM public.invites i
  WHERE i.token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  IF v_invite.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite already accepted';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  -- Check plan user limit
  SELECT o.plan INTO v_plan
  FROM public.organizations o
  WHERE o.id = v_invite.org_id;

  SELECT count(*) INTO v_user_count
  FROM public.users u
  WHERE u.org_id = v_invite.org_id;

  v_user_limit := CASE v_plan
    WHEN 'free' THEN 1
    WHEN 'professional' THEN 1
    WHEN 'business' THEN 5
    WHEN 'enterprise' THEN 999999
    ELSE 1
  END;

  IF v_user_count >= v_user_limit THEN
    RAISE EXCEPTION 'Organization has reached its user limit';
  END IF;

  -- Create user profile
  INSERT INTO public.users (id, org_id, email, full_name, avatar_url, role, is_active)
  VALUES (v_user_id, v_invite.org_id, p_email, p_full_name, p_avatar_url, v_invite.role, true);

  -- Set JWT claim
  PERFORM public.set_user_org_claim(v_user_id, v_invite.org_id);

  -- Mark invite as accepted
  UPDATE public.invites
  SET accepted_at = now(), accepted_by = v_user_id
  WHERE id = v_invite.id;

  RETURN v_invite.org_id;
END;
$$;
