-- =============================================================================
-- Seentrix — Initial Schema Migration
-- Creates all 9 tables, RLS policies, indexes, and triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: auto-update updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 1. ORGANIZATIONS
-- =========================================================================
CREATE TABLE public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 2. USERS
-- =========================================================================
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'viewer'
              CHECK (role IN ('admin','compliance_officer','cto','viewer','editor')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_idx ON public.users (email);
CREATE INDEX users_org_id_idx ON public.users (org_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 3. PRODUCTS
-- =========================================================================
CREATE TABLE public.products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  description           text,
  type                  text CHECK (type IN ('hardware','software','firmware','iot')),
  cra_category          text CHECK (cra_category IN ('default','important_class_i','important_class_ii','critical')),
  conformity_route      text CHECK (conformity_route IN ('module_a','module_b_c','module_h','european_certification')),
  target_market         text,
  connectivity          text,
  data_processing       boolean DEFAULT false,
  intended_use          text,
  requires_notified_body boolean DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_org_id_idx ON public.products (org_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 4. ASSESSMENT_ANSWERS  (child of products)
-- =========================================================================
CREATE TABLE public.assessment_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  question_id     text NOT NULL,
  response        text CHECK (response IN ('not_implemented','partially_implemented','fully_implemented','not_applicable')),
  evidence_url    text,
  notes           text,
  assessed_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assessment_answers_product_id_idx ON public.assessment_answers (product_id);

ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment_answers_select" ON public.assessment_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = assessment_answers.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "assessment_answers_insert" ON public.assessment_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = assessment_answers.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "assessment_answers_update" ON public.assessment_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = assessment_answers.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "assessment_answers_delete" ON public.assessment_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = assessment_answers.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_assessment_answers_updated_at
  BEFORE UPDATE ON public.assessment_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 5. CHECKLIST_ITEMS  (child of products)
-- =========================================================================
CREATE TABLE public.checklist_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  assigned_to         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text,
  category            text,
  regulation_article  text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','in_progress','completed','not_applicable')),
  priority            text NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','critical')),
  due_date            date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checklist_items_product_id_idx ON public.checklist_items (product_id);
CREATE INDEX checklist_items_status_idx     ON public.checklist_items (status);
CREATE INDEX checklist_items_due_date_idx   ON public.checklist_items (due_date);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_select" ON public.checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_items.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "checklist_items_insert" ON public.checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_items.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "checklist_items_update" ON public.checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_items.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "checklist_items_delete" ON public.checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_items.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 6. SBOMS  (child of products)
-- =========================================================================
CREATE TABLE public.sboms (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sbom_format                     text CHECK (sbom_format IN ('cyclonedx','spdx')),
  sbom_version                    integer DEFAULT 1,
  file_url                        text,
  total_components                integer DEFAULT 0,
  components_with_vulnerabilities integer DEFAULT 0,
  validation_status               text DEFAULT 'incomplete'
                                  CHECK (validation_status IN ('valid','invalid','incomplete')),
  annex_ii_compliant              boolean DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sboms_product_id_idx ON public.sboms (product_id);

ALTER TABLE public.sboms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sboms_select" ON public.sboms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sboms.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sboms_insert" ON public.sboms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sboms.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sboms_update" ON public.sboms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sboms.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sboms_delete" ON public.sboms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sboms.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_sboms_updated_at
  BEFORE UPDATE ON public.sboms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 7. SBOM_COMPONENTS  (grandchild: sboms → products)
-- =========================================================================
CREATE TABLE public.sbom_components (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sbom_id                     uuid NOT NULL REFERENCES public.sboms(id) ON DELETE CASCADE,
  component_name              text NOT NULL,
  component_version           text,
  supplier                    text,
  license                     text,
  purl                        text,
  cpe                         text,
  vulnerability_count         integer DEFAULT 0,
  critical_vulnerability_count integer DEFAULT 0,
  high_vulnerability_count    integer DEFAULT 0,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sbom_components_sbom_id_idx ON public.sbom_components (sbom_id);

ALTER TABLE public.sbom_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sbom_components_select" ON public.sbom_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sboms
      JOIN public.products ON products.id = sboms.product_id
      WHERE sboms.id = sbom_components.sbom_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sbom_components_insert" ON public.sbom_components
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sboms
      JOIN public.products ON products.id = sboms.product_id
      WHERE sboms.id = sbom_components.sbom_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sbom_components_update" ON public.sbom_components
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sboms
      JOIN public.products ON products.id = sboms.product_id
      WHERE sboms.id = sbom_components.sbom_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "sbom_components_delete" ON public.sbom_components
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sboms
      JOIN public.products ON products.id = sboms.product_id
      WHERE sboms.id = sbom_components.sbom_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_sbom_components_updated_at
  BEFORE UPDATE ON public.sbom_components
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 8. VULNERABILITIES  (great-grandchild: sbom_components → sboms → products)
-- =========================================================================
CREATE TABLE public.vulnerabilities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sbom_component_id   uuid NOT NULL REFERENCES public.sbom_components(id) ON DELETE CASCADE,
  cve_id              text NOT NULL,
  description         text,
  severity            text CHECK (severity IN ('critical','high','medium','low')),
  cvss_score          numeric(3,1),
  cvss_v4_score       numeric(3,1),
  affected_versions   jsonb,
  fixed_versions      jsonb,
  cisa_kev            boolean DEFAULT false,
  epss_score          numeric(5,4),
  discovery_date      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vulnerabilities_component_id_idx ON public.vulnerabilities (sbom_component_id);
CREATE INDEX vulnerabilities_cve_id_idx       ON public.vulnerabilities (cve_id);
CREATE INDEX vulnerabilities_severity_idx     ON public.vulnerabilities (severity);

ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vulnerabilities_select" ON public.vulnerabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sbom_components
      JOIN public.sboms    ON sboms.id    = sbom_components.sbom_id
      JOIN public.products ON products.id = sboms.product_id
      WHERE sbom_components.id = vulnerabilities.sbom_component_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "vulnerabilities_insert" ON public.vulnerabilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sbom_components
      JOIN public.sboms    ON sboms.id    = sbom_components.sbom_id
      JOIN public.products ON products.id = sboms.product_id
      WHERE sbom_components.id = vulnerabilities.sbom_component_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "vulnerabilities_update" ON public.vulnerabilities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sbom_components
      JOIN public.sboms    ON sboms.id    = sbom_components.sbom_id
      JOIN public.products ON products.id = sboms.product_id
      WHERE sbom_components.id = vulnerabilities.sbom_component_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "vulnerabilities_delete" ON public.vulnerabilities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sbom_components
      JOIN public.sboms    ON sboms.id    = sbom_components.sbom_id
      JOIN public.products ON products.id = sboms.product_id
      WHERE sbom_components.id = vulnerabilities.sbom_component_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_vulnerabilities_updated_at
  BEFORE UPDATE ON public.vulnerabilities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 9. DOCUMENTS  (child of products)
-- =========================================================================
CREATE TABLE public.documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  document_type     text NOT NULL,
  regulation        text CHECK (regulation IN ('cra','nis2','dora')),
  title             text NOT NULL,
  content           text,
  template_used     text,
  file_url          text,
  version           integer DEFAULT 1,
  generated_by_ai   boolean DEFAULT false,
  generated_at      timestamptz,
  legal_references  jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_product_id_idx    ON public.documents (product_id);
CREATE INDEX documents_document_type_idx ON public.documents (document_type);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = documents.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = documents.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = documents.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = documents.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
