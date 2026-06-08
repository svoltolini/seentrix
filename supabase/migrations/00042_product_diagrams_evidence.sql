-- =============================================================================
-- 00041: Product diagrams (Excalidraw) + evidence vault
--
-- Phase 1 of the CRA toolkit build-out. Two artifact stores that feed the
-- Annex VII technical file:
--
--   1. `product_diagrams`     — architecture / data-flow / environment /
--      threat-model / hardware-layout drawings authored in Excalidraw.
--      Each row points at a scene JSON (editable source) + an exported PNG
--      (preview / PDF embedding) in the `product-diagrams` bucket.
--      Annex VII 2(a) (architecture + data-flow) and 1.3 (hardware photos).
--
--   2. `product_evidence`     — uploaded test reports, pen-test results,
--      code-analysis / fuzzing output, third-party tests, due-diligence
--      records, hardware photos. Annex VII point 6 (test reports) etc.
--      Each row carries an `annex_vii_point` tag so the Phase-3 technical-
--      file assembler can slot it into the right section.
--
-- Unlike the append-only conformity attachments (00037), diagrams are
-- editable artifacts: the manufacturer iterates on them, renames, and
-- removes drafts. So both tables get full CRUD policies (still strictly
-- org-scoped). Evidence files are immutable once uploaded but may be
-- deleted (re-upload to "edit").
--
-- Org scoping uses the denormalized `org_id` column compared against the
-- caller's JWT app_metadata org_id — the same claim used by every other
-- product-scoped policy in this schema.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- product_diagrams
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_diagrams (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL,              -- denormalized for RLS
  type         text NOT NULL CHECK (type IN (
                 'architecture',
                 'data_flow',
                 'environment',
                 'threat_model',
                 'hardware_layout'
               )),
  title        text NOT NULL CHECK (length(trim(title)) > 0),
  scene_url    text,                       -- storage path to scene JSON
  preview_url  text,                       -- storage path to exported PNG
  version      integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_diagrams_lookup
  ON public.product_diagrams (product_id, type, updated_at DESC);

ALTER TABLE public.product_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_diagrams_select"
  ON public.product_diagrams
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "product_diagrams_insert"
  ON public.product_diagrams
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_diagrams.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "product_diagrams_update"
  ON public.product_diagrams
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  ) WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "product_diagrams_delete"
  ON public.product_diagrams
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.product_diagrams IS
  'Excalidraw diagrams (architecture / data-flow / environment / threat-model '
  '/ hardware-layout) per product. Feeds Annex VII 2(a) + 1.3. Scene JSON + '
  'preview PNG live in the private product-diagrams storage bucket.';

-- ---------------------------------------------------------------------------
-- product_evidence
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_evidence (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id           uuid NOT NULL,          -- denormalized for RLS
  category         text NOT NULL CHECK (category IN (
                     'test_report',
                     'penetration_test',
                     'code_analysis',
                     'fuzzing',
                     'third_party_test',
                     'due_diligence',
                     'hardware_photo',
                     'other'
                   )),
  title            text NOT NULL CHECK (length(trim(title)) > 0),
  file_url         text NOT NULL,          -- storage path
  file_name        text NOT NULL,
  file_size        integer NOT NULL CHECK (file_size > 0 AND file_size <= 26214400),
  mime             text NOT NULL,
  annex_vii_point  text,                   -- e.g. '6', '1.3', '2.c', '13.5'
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_evidence_lookup
  ON public.product_evidence (product_id, category, created_at DESC);

ALTER TABLE public.product_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_evidence_select"
  ON public.product_evidence
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "product_evidence_insert"
  ON public.product_evidence
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_evidence.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "product_evidence_delete"
  ON public.product_evidence
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.product_evidence IS
  'Evidence vault — test reports, pen-tests, code analysis, fuzzing, '
  'third-party tests, due-diligence, hardware photos. Each row tags an '
  'Annex VII point for the technical-file assembler. 25 MB cap per file.';

-- =============================================================================
-- Storage buckets
-- =============================================================================

-- product-diagrams — scene JSON (application/json) + preview PNG.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-diagrams',
  'product-diagrams',
  false,
  10485760, -- 10 MB (scene JSON with embedded image files can grow)
  ARRAY[
    'application/json',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- product-evidence — broad allowlist, 25 MB cap.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-evidence',
  'product-evidence',
  false,
  26214400, -- 25 MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS — folder layout is <org_id>/<product_id>/<...>. The leading
-- org_id segment (foldername(name)[1]) is what gates access, mirroring the
-- conformity-attachments bucket (00037).
-- ---------------------------------------------------------------------------

-- product-diagrams: full CRUD (diagrams are re-saved in place + deletable).
CREATE POLICY "product_diagrams_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-diagrams'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "product_diagrams_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-diagrams'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "product_diagrams_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-diagrams'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "product_diagrams_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-diagrams'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- product-evidence: select / insert / delete (no in-place edit).
CREATE POLICY "product_evidence_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-evidence'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "product_evidence_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-evidence'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "product_evidence_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-evidence'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);
