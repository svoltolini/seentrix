-- =============================================================================
-- 00037: Conformity step attachments (file uploads on workflow steps)
--
-- Lets compliance officers / editors attach documents and images to a
-- specific conformity workflow step. Same append-only contract as the
-- comment thread (migration 00036): files can be uploaded but not edited
-- or deleted, so the audit trail is immutable.
--
-- Two halves:
--   1. `product_conformity_step_attachments` — metadata row per upload
--      (name, mime, size, storage path, uploader).
--   2. `conformity-attachments` storage bucket — actual file bytes.
--      Folder layout mirrors `document-pdfs`: <org_id>/<...>.
-- =============================================================================

CREATE TABLE public.product_conformity_step_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  step_key      text NOT NULL,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  storage_path  text NOT NULL,
  file_name     text NOT NULL CHECK (length(trim(file_name)) > 0),
  mime_type     text NOT NULL,
  size_bytes    integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 2097152),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conformity_step_attachments_lookup
  ON public.product_conformity_step_attachments
    (product_id, step_key, created_at ASC);

ALTER TABLE public.product_conformity_step_attachments
  ENABLE ROW LEVEL SECURITY;

-- Select: anyone in the same org can read attachments metadata.
CREATE POLICY "conformity_step_attachments_select"
  ON public.product_conformity_step_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_step_attachments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Insert: any same-org member; user_id must match the authenticated
-- user (no impersonation). Role-based write gating happens in the
-- server action.
CREATE POLICY "conformity_step_attachments_insert"
  ON public.product_conformity_step_attachments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_step_attachments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- No UPDATE / DELETE policies — append-only, matches the comment
-- thread contract. If a file was uploaded by mistake, post a
-- follow-up comment explaining and upload the correct file.

COMMENT ON TABLE public.product_conformity_step_attachments IS
  'Append-only file attachments on conformity workflow steps. '
  '2 MB max per file, no edit / delete — audit trail is immutable.';

-- =============================================================================
-- Storage bucket — conformity-attachments
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conformity-attachments',
  'conformity-attachments',
  false,
  2097152, -- 2 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — folder layout is <org_id>/<product_id>/<step_key>/<file>.
-- foldername(name)[1] is the first path segment (org_id).

CREATE POLICY "conformity_attachments_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'conformity-attachments'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "conformity_attachments_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'conformity-attachments'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- No DELETE policy on storage objects — keep the bucket append-only
-- to match the metadata table. (Hard cleanup of orphaned files goes
-- through a separate scheduled job if it becomes a cost issue.)
