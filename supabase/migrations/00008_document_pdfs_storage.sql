-- =========================================================================
-- 00008: Create document-pdfs storage bucket with org-scoped RLS
-- =========================================================================

-- Create document-pdfs storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-pdfs',
  'document-pdfs',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their org's folder
CREATE POLICY "document_pdfs_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-pdfs'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- Storage RLS: users can read files from their org's folder
CREATE POLICY "document_pdfs_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-pdfs'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- Storage RLS: users can delete files from their org's folder
CREATE POLICY "document_pdfs_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-pdfs'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);
