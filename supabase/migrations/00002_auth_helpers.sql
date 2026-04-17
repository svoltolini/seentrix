-- Migration: Auth helper functions for onboarding
-- These SECURITY DEFINER functions bypass RLS so users can create their org during onboarding
-- (before they have an org_id in their JWT).

-- 1. Set org_id claim on a user's JWT metadata
create or replace function public.set_user_org_claim(p_user_id uuid, p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', p_org_id)
  where id = p_user_id;
end;
$$;

-- 2. Atomic onboarding: create org + user profile + set JWT claim
create or replace function public.create_org_and_user(p_org_name text, p_full_name text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_org_id  uuid;
begin
  -- Get the authenticated user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Prevent double-onboarding
  if exists (select 1 from public.users where id = v_user_id) then
    raise exception 'User already onboarded';
  end if;

  -- Create the organization
  insert into public.organizations (name)
  values (p_org_name)
  returning id into v_org_id;

  -- Create the user profile
  insert into public.users (id, org_id, email, full_name, role, is_active)
  values (v_user_id, v_org_id, p_email, p_full_name, 'admin', true);

  -- Set the org_id claim on the JWT
  perform public.set_user_org_claim(v_user_id, v_org_id);

  return v_org_id;
end;
$$;
