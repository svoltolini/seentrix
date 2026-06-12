-- =============================================================================
-- 00052: Diagram versioning — one valid diagram per type, archive on update
--
-- Previously a re-save bumped `version` in place and OVERWROTE the scene +
-- preview in storage, so no history survived and nothing stopped several
-- diagrams of the same type. New model:
--
--   * At most ONE active diagram per (product, type) — "the valid diagram".
--   * Updating archives the current row (archived_at) and inserts a new row
--     (version + 1) with its own storage objects, so every version's scene
--     and preview survive. Annex VII record-keeping (10 years) wants the
--     historical drawings kept, not overwritten.
--   * An archived version can be restored: it becomes the active one and the
--     previously-active row is archived.
--
-- Backfill: where several rows of one (product, type) exist, the most
-- recently updated stays active; the rest are archived in place.
-- =============================================================================

ALTER TABLE public.product_diagrams
  ADD COLUMN archived_at timestamptz;

UPDATE public.product_diagrams
SET archived_at = updated_at
WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, type) id
  FROM public.product_diagrams
  ORDER BY product_id, type, updated_at DESC
);

-- Enforce the one-active-diagram-per-type rule.
CREATE UNIQUE INDEX uq_product_diagrams_active_type
  ON public.product_diagrams (product_id, type)
  WHERE archived_at IS NULL;
