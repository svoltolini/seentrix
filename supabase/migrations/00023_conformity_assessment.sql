-- =============================================================================
-- 00023: Conformity assessment workflow + notified body record
-- Wraps the product.conformity_route column (already captured at product
-- creation) in an actual per-step workflow and a notified-body record so the
-- Declaration of Conformity can be generated with real data.
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS notified_body_name  text,
  ADD COLUMN IF NOT EXISTS notified_body_id    text,
  ADD COLUMN IF NOT EXISTS notified_body_scope text,
  ADD COLUMN IF NOT EXISTS declaration_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS declaration_version   text;

CREATE TABLE public.product_conformity_steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  step_key       text NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'complete', 'not_applicable')),
  notes          text,
  completed_at   timestamptz,
  completed_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, step_key)
);

CREATE INDEX idx_conformity_steps_product ON public.product_conformity_steps (product_id);

CREATE OR REPLACE FUNCTION public.tg_conformity_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER conformity_steps_touch_updated_at
  BEFORE UPDATE ON public.product_conformity_steps
  FOR EACH ROW EXECUTE FUNCTION public.tg_conformity_touch_updated_at();

ALTER TABLE public.product_conformity_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conformity_steps_select" ON public.product_conformity_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_steps.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "conformity_steps_insert" ON public.product_conformity_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_steps.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "conformity_steps_update" ON public.product_conformity_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_steps.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );
