-- =============================================================================
-- 00030: Scope product-images storage to the caller's org folder
-- Migration 00013 created the bucket with write policies that only checked
-- bucket_id — any authenticated user could INSERT / UPDATE / DELETE any
-- object in the bucket, including other orgs' product photos.
-- Migration 00028 only trimmed the SELECT policy; this one fixes the writes
-- so they match the per-org folder layout the upload code already uses
-- (`${orgId}/${uuid}.${ext}`).
-- =============================================================================

DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;

CREATE POLICY "product_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] =
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'org_id')
  );

CREATE POLICY "product_images_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] =
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'org_id')
  );

CREATE POLICY "product_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] =
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'org_id')
  );
