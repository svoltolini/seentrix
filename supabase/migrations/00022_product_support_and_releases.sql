-- =============================================================================
-- 00022: Support period + security-update tracking
-- CRA Annex I Part II obliges manufacturers to provide security updates
-- throughout the product's support period (>= 5 years). These columns let
-- a workspace record that commitment per product and log the actual releases.
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS support_period_start date,
  ADD COLUMN IF NOT EXISTS support_period_end   date,
  ADD COLUMN IF NOT EXISTS update_channel       text;

CREATE INDEX IF NOT EXISTS idx_products_support_period_end
  ON public.products (support_period_end)
  WHERE support_period_end IS NOT NULL;

CREATE TABLE public.product_releases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version         text NOT NULL,
  released_at     date NOT NULL DEFAULT CURRENT_DATE,
  release_type    text NOT NULL DEFAULT 'security'
    CHECK (release_type IN ('security', 'feature', 'bugfix', 'maintenance')),
  cves_fixed      text[] NOT NULL DEFAULT ARRAY[]::text[],
  release_notes   text,
  signed_digest   text,
  is_security_update boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version)
);

CREATE INDEX idx_product_releases_product ON public.product_releases (product_id, released_at DESC);
CREATE INDEX idx_product_releases_security ON public.product_releases (is_security_update)
  WHERE is_security_update = true;

ALTER TABLE public.product_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_releases_select" ON public.product_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_releases.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "product_releases_insert" ON public.product_releases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_releases.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "product_releases_update" ON public.product_releases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_releases.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "product_releases_delete" ON public.product_releases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_releases.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );
