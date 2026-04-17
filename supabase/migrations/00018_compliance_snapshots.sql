-- =============================================================================
-- Compliance Snapshots — daily per-product compliance scores
-- Auto-maintained by a trigger on checklist_items
-- =============================================================================

CREATE TABLE public.compliance_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date    date NOT NULL DEFAULT CURRENT_DATE,
  total_items      integer NOT NULL DEFAULT 0,
  completed_items  integer NOT NULL DEFAULT 0,
  applicable_items integer NOT NULL DEFAULT 0,
  score            integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, snapshot_date)
);

CREATE INDEX idx_compliance_snapshots_org_date
  ON public.compliance_snapshots (org_id, snapshot_date DESC);

CREATE INDEX idx_compliance_snapshots_product_date
  ON public.compliance_snapshots (product_id, snapshot_date DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_snapshots_select" ON public.compliance_snapshots
  FOR SELECT USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "compliance_snapshots_insert" ON public.compliance_snapshots
  FOR INSERT WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "compliance_snapshots_update" ON public.compliance_snapshots
  FOR UPDATE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

CREATE POLICY "compliance_snapshots_delete" ON public.compliance_snapshots
  FOR DELETE USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- ---------------------------------------------------------------------------
-- Auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE TRIGGER set_compliance_snapshots_updated_at
  BEFORE UPDATE ON public.compliance_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger function: upsert today's snapshot when checklist_items change
-- SECURITY DEFINER so trigger bypasses RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_compliance_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_org_id     uuid;
  v_total      integer;
  v_completed  integer;
  v_applicable integer;
  v_score      integer;
BEGIN
  -- Determine which product was affected
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Look up org_id from products
  SELECT org_id INTO v_org_id
    FROM public.products
   WHERE id = v_product_id;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count checklist statuses for this product
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status != 'not_applicable')
  INTO v_total, v_completed, v_applicable
  FROM public.checklist_items
  WHERE product_id = v_product_id;

  -- Calculate score (0–100)
  IF v_applicable > 0 THEN
    v_score := ROUND((v_completed::numeric / v_applicable) * 100);
  ELSE
    v_score := 0;
  END IF;

  -- Upsert today's snapshot
  INSERT INTO public.compliance_snapshots
    (product_id, org_id, snapshot_date, total_items, completed_items, applicable_items, score)
  VALUES
    (v_product_id, v_org_id, CURRENT_DATE, v_total, v_completed, v_applicable, v_score)
  ON CONFLICT (product_id, snapshot_date) DO UPDATE SET
    total_items      = EXCLUDED.total_items,
    completed_items  = EXCLUDED.completed_items,
    applicable_items = EXCLUDED.applicable_items,
    score            = EXCLUDED.score,
    updated_at       = now();

  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Attach trigger to checklist_items
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_checklist_compliance_snapshot
  AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.upsert_compliance_snapshot();

-- ---------------------------------------------------------------------------
-- Backfill: create initial snapshot for all existing products
-- ---------------------------------------------------------------------------
INSERT INTO public.compliance_snapshots
  (product_id, org_id, snapshot_date, total_items, completed_items, applicable_items, score)
SELECT
  p.id AS product_id,
  p.org_id,
  CURRENT_DATE AS snapshot_date,
  COALESCE(ci.total, 0),
  COALESCE(ci.completed, 0),
  COALESCE(ci.applicable, 0),
  CASE
    WHEN COALESCE(ci.applicable, 0) > 0
    THEN ROUND((ci.completed::numeric / ci.applicable) * 100)
    ELSE 0
  END AS score
FROM public.products p
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                        AS total,
    COUNT(*) FILTER (WHERE status = 'completed')    AS completed,
    COUNT(*) FILTER (WHERE status != 'not_applicable') AS applicable
  FROM public.checklist_items
  WHERE product_id = p.id
) ci ON true
ON CONFLICT (product_id, snapshot_date) DO NOTHING;
