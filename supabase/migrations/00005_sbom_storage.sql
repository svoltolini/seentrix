-- =========================================================================
-- 00005: Add SBOM storage columns + create storage bucket
-- =========================================================================

-- Add file_name and storage_path columns to sboms table
ALTER TABLE public.sboms
  ADD COLUMN IF NOT EXISTS file_name    text,
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Create sboms storage bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sboms',
  'sboms',
  false,
  52428800, -- 50MB
  ARRAY['application/json', 'application/xml', 'text/xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their org's folder
CREATE POLICY "sboms_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sboms'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- Storage RLS: users can read files from their org's folder
CREATE POLICY "sboms_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'sboms'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- Storage RLS: users can delete files from their org's folder
CREATE POLICY "sboms_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sboms'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);
