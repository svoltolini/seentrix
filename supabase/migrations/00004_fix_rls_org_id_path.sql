-- =============================================================================
-- Fix RLS policies: read org_id from app_metadata instead of top-level JWT
-- The JWT structure nests custom claims under app_metadata:
--   auth.jwt() -> 'app_metadata' ->> 'org_id'
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;

CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- 2. USERS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- 3. PRODUCTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- 4. ASSESSMENT_ANSWERS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "assessment_answers_select" ON public.assessment_answers;
DROP POLICY IF EXISTS "assessment_answers_insert" ON public.assessment_answers;
DROP POLICY IF EXISTS "assessment_answers_update" ON public.assessment_answers;
DROP POLICY IF EXISTS "assessment_answers_delete" ON public.assessment_answers;

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

-- ---------------------------------------------------------------------------
-- 5. CHECKLIST_ITEMS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "checklist_items_select" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_update" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete" ON public.checklist_items;

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

-- ---------------------------------------------------------------------------
-- 6. SBOMS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sboms_select" ON public.sboms;
DROP POLICY IF EXISTS "sboms_insert" ON public.sboms;
DROP POLICY IF EXISTS "sboms_update" ON public.sboms;
DROP POLICY IF EXISTS "sboms_delete" ON public.sboms;

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

-- ---------------------------------------------------------------------------
-- 7. SBOM_COMPONENTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sbom_components_select" ON public.sbom_components;
DROP POLICY IF EXISTS "sbom_components_insert" ON public.sbom_components;
DROP POLICY IF EXISTS "sbom_components_update" ON public.sbom_components;
DROP POLICY IF EXISTS "sbom_components_delete" ON public.sbom_components;

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

-- ---------------------------------------------------------------------------
-- 8. VULNERABILITIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "vulnerabilities_select" ON public.vulnerabilities;
DROP POLICY IF EXISTS "vulnerabilities_insert" ON public.vulnerabilities;
DROP POLICY IF EXISTS "vulnerabilities_update" ON public.vulnerabilities;
DROP POLICY IF EXISTS "vulnerabilities_delete" ON public.vulnerabilities;

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

-- ---------------------------------------------------------------------------
-- 9. DOCUMENTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

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
