-- =============================================================================
-- 00045: Article 14 reporting submissions (CRA Phase 4)
--
-- The `incidents` table already drives the Article 14 workflow (the aware_at
-- clock, the three phase timestamps + narratives, the user-notification step).
-- This phase adds the missing ENISA Single Reporting Platform piece: a per-stage
-- submission log that records the structured content sent and the SRP reference
-- number returned. One row per (incident, stage) — re-submitting a stage updates
-- it in place.
-- =============================================================================

CREATE TABLE public.incident_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL,                 -- denormalized for RLS
  stage         text NOT NULL
                  CHECK (stage IN ('early_warning', 'incident_report', 'final_report')),
  content       jsonb,                         -- structured submission snapshot
  reference_no  text,                          -- reference returned by the ENISA SRP
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  submitted_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, stage)
);

CREATE INDEX idx_incident_submissions_lookup
  ON public.incident_submissions (incident_id);

ALTER TABLE public.incident_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incident_submissions_select"
  ON public.incident_submissions
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "incident_submissions_insert"
  ON public.incident_submissions
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_submissions.incident_id
        AND i.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "incident_submissions_update"
  ON public.incident_submissions
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  ) WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "incident_submissions_delete"
  ON public.incident_submissions
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

COMMENT ON TABLE public.incident_submissions IS
  'Per-stage Article 14 submission log for an incident: the structured content '
  'and the ENISA Single Reporting Platform reference number. One row per '
  '(incident, stage).';
