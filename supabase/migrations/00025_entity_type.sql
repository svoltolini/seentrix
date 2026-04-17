-- =============================================================================
-- 00025: Economic-operator role on organizations + per-obligation checklist
-- The CRA distinguishes manufacturers (Art. 13), authorised representatives
-- (Art. 17), importers (Art. 19) and distributors (Art. 20). Each role has
-- its own set of due-diligence obligations. This migration adds the role
-- flag and a small obligations-checklist to keep whichever role the customer
-- plays accountable.
-- =============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'manufacturer'
    CHECK (entity_type IN ('manufacturer', 'authorised_representative', 'importer', 'distributor'));

CREATE TABLE public.entity_obligations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  obligation_key  text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'complete', 'not_applicable')),
  notes           text,
  completed_at    timestamptz,
  completed_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, obligation_key)
);

CREATE INDEX idx_entity_obligations_org ON public.entity_obligations (org_id);

CREATE OR REPLACE FUNCTION public.tg_entity_obligations_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER entity_obligations_touch_updated_at
  BEFORE UPDATE ON public.entity_obligations
  FOR EACH ROW EXECUTE FUNCTION public.tg_entity_obligations_touch_updated_at();

ALTER TABLE public.entity_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_obligations_select" ON public.entity_obligations
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "entity_obligations_insert" ON public.entity_obligations
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "entity_obligations_update" ON public.entity_obligations
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );
