-- =============================================================================
-- 00044: Annex VII technical-file assembler + retention (Art 13(13))
--
-- Phase 3 of the CRA toolkit. The technical file compiles the artifacts the
-- earlier phases produce (general description, architecture/data-flow diagrams,
-- SBOM + vulnerability handling, risk assessment, support period, standards,
-- test reports, Declaration of Conformity) into one versioned, dated document.
-- Annex VII point ordering lives in src/lib/constants/annex-vii.ts.
--
--   `technical_files` — one versioned envelope per product. A draft is the
--   working copy (its PDF + coverage manifest are regenerated from live data on
--   each assemble); releasing locks it, stamps released_at + retention_until,
--   and the released snapshot is immutable (soft-archive only, never hard
--   deleted). retention_until = max(released_at + 10 years, support-period end)
--   per Art 13(13).
--
-- Also adds retention stamps to `documents` so a released Declaration of
-- Conformity carries the same "retained until" obligation.
--
-- Org scoping mirrors 00043: the denormalized `org_id` column is compared
-- against the caller's JWT app_metadata org_id.
-- =============================================================================

CREATE TABLE public.technical_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id           uuid NOT NULL,                 -- denormalized for RLS
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'released', 'archived')),
  version          integer NOT NULL DEFAULT 1 CHECK (version > 0),
  manifest         jsonb,                         -- coverage snapshot at assemble/release
  pdf_url          text,                          -- storage path in document-pdfs
  released_at      timestamptz,
  retention_until  timestamptz,                   -- Art 13(13): released_at + 10y (or support end)
  archived_at      timestamptz,
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technical_files_lookup
  ON public.technical_files (product_id, version DESC);

-- At most one editable draft per product; released versions are immutable.
CREATE UNIQUE INDEX uniq_technical_file_draft
  ON public.technical_files (product_id)
  WHERE status = 'draft';

ALTER TABLE public.technical_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_files_select"
  ON public.technical_files
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "technical_files_insert"
  ON public.technical_files
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = technical_files.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "technical_files_update"
  ON public.technical_files
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  ) WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "technical_files_delete"
  ON public.technical_files
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.technical_files IS
  'Versioned Annex VII technical file per product. One editable draft; '
  'releasing locks the version, stamps released_at + retention_until (Art '
  '13(13): 10 years or support-period end), and is soft-archived not deleted.';

-- ---------------------------------------------------------------------------
-- Retention stamps on documents (for the released Declaration of Conformity)
-- ---------------------------------------------------------------------------

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_until timestamptz;

COMMENT ON COLUMN public.documents.retention_until IS
  'Art 13(13) retention deadline, stamped when a Declaration of Conformity is '
  'marked final (released_at + 10 years, or the support-period end if later).';
