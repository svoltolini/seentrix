-- =============================================================================
-- 00047: Lifecycle & supply-chain records (CRA Phase 6)
--
-- Adds the post-market / lifecycle registers that the earlier phases did not
-- cover, each per-product and org-scoped (RLS mirrors prior phases):
--
--   * supply_chain_entries        — Art 23 supply-chain register (upstream
--                                   suppliers + downstream operators; 10-year
--                                   retention surfaced in the UI).
--   * monitoring_entries          — Art 13(7) post-market monitoring register
--                                   (documented cybersecurity aspects over time).
--   * vulnerability_advisories    — Annex I Part II(4) per-fix public advisory.
--   * security_tests              — Annex I Part II(3) recurring security-test
--                                   schedule + log.
--
-- Plus product columns for the conformity-module surveillance notes (Art 32 /
-- Annex VIII), the end-of-support notification (Art 13(19)) and the
-- corrective-action / recall procedure (Art 13(21)).
-- =============================================================================

-- Shared RLS helper expression: org_id = caller's JWT app_metadata org_id.

-- ---------------------------------------------------------------------------
-- supply_chain_entries (Art 23)
-- ---------------------------------------------------------------------------
CREATE TABLE public.supply_chain_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL,
  relation    text NOT NULL
                CHECK (relation IN ('upstream_supplier', 'downstream_operator')),
  entity_type text,
  name        text NOT NULL,
  address     text,
  contact     text,
  notes       text,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_supply_chain_entries_lookup
  ON public.supply_chain_entries (product_id);
ALTER TABLE public.supply_chain_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supply_chain_entries_select" ON public.supply_chain_entries
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "supply_chain_entries_insert" ON public.supply_chain_entries
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM public.products WHERE products.id = supply_chain_entries.product_id
      AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));
CREATE POLICY "supply_chain_entries_update" ON public.supply_chain_entries
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "supply_chain_entries_delete" ON public.supply_chain_entries
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- monitoring_entries (Art 13(7))
-- ---------------------------------------------------------------------------
CREATE TABLE public.monitoring_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL,
  entry_date  date NOT NULL DEFAULT CURRENT_DATE,
  source      text NOT NULL
                CHECK (source IN ('internal_review', 'advisory', 'incident', 'security_test', 'external_report', 'other')),
  severity    text CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  description text NOT NULL,
  link        text,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_monitoring_entries_lookup
  ON public.monitoring_entries (product_id, entry_date DESC);
ALTER TABLE public.monitoring_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monitoring_entries_select" ON public.monitoring_entries
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "monitoring_entries_insert" ON public.monitoring_entries
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM public.products WHERE products.id = monitoring_entries.product_id
      AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));
CREATE POLICY "monitoring_entries_update" ON public.monitoring_entries
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "monitoring_entries_delete" ON public.monitoring_entries
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- vulnerability_advisories (Annex I Part II(4))
-- ---------------------------------------------------------------------------
CREATE TABLE public.vulnerability_advisories (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL,
  advisory_ref      text,
  cve_id            text,
  title             text NOT NULL,
  summary           text,
  affected_versions text,
  fixed_version     text,
  severity          text CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  published_at      date,
  is_public         boolean NOT NULL DEFAULT false,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vulnerability_advisories_lookup
  ON public.vulnerability_advisories (product_id, published_at DESC);
ALTER TABLE public.vulnerability_advisories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vulnerability_advisories_select" ON public.vulnerability_advisories
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "vulnerability_advisories_insert" ON public.vulnerability_advisories
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM public.products WHERE products.id = vulnerability_advisories.product_id
      AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));
CREATE POLICY "vulnerability_advisories_update" ON public.vulnerability_advisories
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "vulnerability_advisories_delete" ON public.vulnerability_advisories
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
-- Anonymous read for public advisories whose org has public pages enabled.
CREATE POLICY "vulnerability_advisories_public_select" ON public.vulnerability_advisories
  FOR SELECT TO anon USING (
    is_public = true
    AND EXISTS (SELECT 1 FROM public.organizations o
      WHERE o.id = vulnerability_advisories.org_id AND o.security_public_enabled = true)
  );

-- ---------------------------------------------------------------------------
-- security_tests (Annex I Part II(3)) — recurring schedule + log
-- ---------------------------------------------------------------------------
CREATE TABLE public.security_tests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL,
  test_type         text NOT NULL
                      CHECK (test_type IN ('penetration_test', 'code_analysis', 'fuzzing', 'sast', 'dast', 'third_party_audit', 'other')),
  frequency_days    integer CHECK (frequency_days IS NULL OR frequency_days > 0),
  last_performed_at date,
  next_due          date,
  result            text,
  notes             text,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_security_tests_lookup ON public.security_tests (product_id);
ALTER TABLE public.security_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_tests_select" ON public.security_tests
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "security_tests_insert" ON public.security_tests
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM public.products WHERE products.id = security_tests.product_id
      AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));
CREATE POLICY "security_tests_update" ON public.security_tests
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
CREATE POLICY "security_tests_delete" ON public.security_tests
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- Product columns: conformity-module surveillance + end-of-support + recall
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS notified_body_surveillance_notes text,  -- Art 32 / Annex VIII
  ADD COLUMN IF NOT EXISTS corrective_action_procedure      text,  -- Art 13(21)
  ADD COLUMN IF NOT EXISTS eos_notice                       text,  -- Art 13(19)
  ADD COLUMN IF NOT EXISTS eos_notified_at                  timestamptz;
