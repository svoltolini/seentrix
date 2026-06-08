-- =============================================================================
-- 00046: DoC / CE / Annex II / product-identity completeness (CRA Phase 5)
--
-- The DoC generator already captures the Annex V fields and the products table
-- already holds most identity/support metadata. This migration adds the
-- remaining pieces:
--
--   * Product identification (Art 13(15)-(16)): type/model, batch and serial.
--   * Annex II buyer information: a "known / foreseeable risks" field, used by
--     the end-user-information generator.
--   * Notified-body certificate number (Annex V, where a notified body issued
--     one).
--   * CE marking affixing record (Art 30): where/when the CE marking is applied.
--   * Simplified DoC (Annex VI): a per-product public toggle + an anon read
--     policy so the simplified declaration is reachable at a public URL when the
--     org has opted into public pages.
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS model_number             text,
  ADD COLUMN IF NOT EXISTS batch_number             text,
  ADD COLUMN IF NOT EXISTS serial_number            text,
  ADD COLUMN IF NOT EXISTS known_risks              text,
  ADD COLUMN IF NOT EXISTS notified_body_certificate text,
  ADD COLUMN IF NOT EXISTS ce_affixed_at            date,
  ADD COLUMN IF NOT EXISTS ce_locations             text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ce_notes                 text,
  ADD COLUMN IF NOT EXISTS public_doc_enabled       boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.ce_locations IS
  'Where the CE marking is affixed: any of product / packaging / documentation / website (Art 30).';
COMMENT ON COLUMN public.products.public_doc_enabled IS
  'When true (and the org has security_public_enabled), the simplified DoC '
  '(Annex VI) is reachable anonymously at /doc/<org-slug>/<product-id>.';

-- ---------------------------------------------------------------------------
-- Anonymous read for published simplified DoCs (Annex VI). Permissive policy
-- scoped to the anon role; the org-scoped authenticated policies are unaffected.
-- A product is publicly readable only when it has opted in AND its org has
-- enabled public pages.
-- ---------------------------------------------------------------------------

CREATE POLICY "products_public_doc_select"
  ON public.products
  FOR SELECT
  TO anon
  USING (
    public_doc_enabled = true
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = products.org_id
        AND o.security_public_enabled = true
    )
  );
