-- =============================================================================
-- 00028: Drop the blanket SELECT policies on public storage buckets
-- Supabase's public_bucket_allows_listing advisor flags these as over-broad.
-- Public buckets serve individual files via their public URL without needing
-- RLS, and a grep of the codebase confirms the app only ever uses
-- getPublicUrl() (which bypasses RLS) + upload() / remove() (which go through
-- INSERT / DELETE policies). Dropping SELECT removes the ability to .list()
-- all files in the bucket from an anon client — which we don't do anyway.
-- =============================================================================

DROP POLICY IF EXISTS "avatars_select"        ON storage.objects;
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
