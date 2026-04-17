-- =========================================================================
-- 00012: Avatars storage bucket + update RPC for avatar support
-- =========================================================================

-- Create avatars storage bucket (public — profile pictures need to be viewable)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
CREATE POLICY "avatars_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Users can update their own avatars
CREATE POLICY "avatars_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatars
CREATE POLICY "avatars_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update create_org_and_user to accept optional avatar_url
CREATE OR REPLACE FUNCTION public.create_org_and_user(
  p_org_name text,
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
  v_user_id uuid;
  v_org_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User already onboarded';
  END IF;

  INSERT INTO public.organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  INSERT INTO public.users (id, org_id, email, full_name, avatar_url, role, is_active)
  VALUES (v_user_id, v_org_id, p_email, p_full_name, p_avatar_url, 'admin', true);

  PERFORM public.set_user_org_claim(v_user_id, v_org_id);

  RETURN v_org_id;
END;
$$;
