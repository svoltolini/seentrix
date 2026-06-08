-- =============================================================================
-- 00043: Structured, versioned Risk Assessment (Art 13(3) + Annex VII point 3)
--
-- Phase 2 of the CRA toolkit. Replaces the light free-text risk-assessment
-- document with a structured, versioned assessment that maps EVERY Annex I
-- requirement (Part I ×13 + Part II ×8 = 21) to an applicability decision and,
-- where it applies, a threat → likelihood/impact → mitigation → residual-risk
-- analysis. Art 13(4) requires a justification for any requirement deemed
-- not applicable.
--
--   1. `risk_assessments`       — the per-version envelope: the Art 13(3)
--      context (intended purpose, operational environment, assets, expected
--      lifetime), a draft/released status, a version number and released_at
--      stamp, plus the generated PDF path. One editable draft per product;
--      releasing locks it; a new draft (version+1) is cloned to revise.
--
--   2. `risk_assessment_items`  — one row per Annex I requirement per
--      assessment. `requirement_id` matches the ids in
--      src/lib/constants/cra-requirements.ts.
--
-- Org scoping uses the denormalized `org_id` column compared against the
-- caller's JWT app_metadata org_id — the same claim every other product-scoped
-- policy in this schema uses (mirrors 00037 / 00042).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- risk_assessments
-- ---------------------------------------------------------------------------

CREATE TABLE public.risk_assessments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id               uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id                   uuid NOT NULL,              -- denormalized for RLS
  intended_purpose         text,
  operational_environment  text,
  assets_to_protect        text,
  expected_lifetime        text,
  status                   text NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'released')),
  version                  integer NOT NULL DEFAULT 1 CHECK (version > 0),
  released_at              timestamptz,
  pdf_url                  text,                       -- storage path in document-pdfs
  created_by               uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_assessments_lookup
  ON public.risk_assessments (product_id, version DESC);

-- At most one editable draft per product; released snapshots are immutable.
CREATE UNIQUE INDEX uniq_risk_assessment_draft
  ON public.risk_assessments (product_id)
  WHERE status = 'draft';

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_assessments_select"
  ON public.risk_assessments
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "risk_assessments_insert"
  ON public.risk_assessments
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = risk_assessments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "risk_assessments_update"
  ON public.risk_assessments
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  ) WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "risk_assessments_delete"
  ON public.risk_assessments
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.risk_assessments IS
  'Structured CRA risk assessment per product (Art 13(3), Annex VII point 3). '
  'One editable draft per product; releasing locks the version and stamps '
  'released_at; revise by cloning into a new draft (version+1).';

-- ---------------------------------------------------------------------------
-- risk_assessment_items — one row per Annex I requirement per assessment
-- ---------------------------------------------------------------------------

CREATE TABLE public.risk_assessment_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_assessment_id  uuid NOT NULL REFERENCES public.risk_assessments(id) ON DELETE CASCADE,
  org_id              uuid NOT NULL,            -- denormalized for RLS
  requirement_id      text NOT NULL,           -- matches cra-requirements.ts ids
  applicability       text CHECK (applicability IN ('applies', 'not_applicable')),
  -- Risk analysis (when applicability = 'applies'):
  threat              text,
  likelihood          text CHECK (likelihood IN ('low', 'medium', 'high')),
  impact              text CHECK (impact IN ('low', 'medium', 'high')),
  implementation      text,                     -- mitigating controls / how it's met
  residual_risk       text CHECK (residual_risk IN ('low', 'medium', 'high')),
  -- When applicability = 'not_applicable' (Art 13(4)):
  justification       text,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (risk_assessment_id, requirement_id)
);

CREATE INDEX idx_risk_assessment_items_lookup
  ON public.risk_assessment_items (risk_assessment_id);

ALTER TABLE public.risk_assessment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_assessment_items_select"
  ON public.risk_assessment_items
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "risk_assessment_items_insert"
  ON public.risk_assessment_items
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.risk_assessments ra
      WHERE ra.id = risk_assessment_items.risk_assessment_id
        AND ra.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "risk_assessment_items_update"
  ON public.risk_assessment_items
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  ) WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "risk_assessment_items_delete"
  ON public.risk_assessment_items
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.risk_assessment_items IS
  'One row per Annex I requirement per risk assessment. requirement_id matches '
  'cra-requirements.ts. applies → threat/likelihood/impact/implementation/'
  'residual_risk; not_applicable → justification (Art 13(4)).';
