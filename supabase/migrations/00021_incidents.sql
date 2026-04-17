-- =============================================================================
-- 00021: Article 14 incident reporting
-- Tracks security incidents and actively-exploited-vulnerability events with
-- the 24h / 72h / 14d reporting obligations required by the CRA.
-- =============================================================================

CREATE TABLE public.incidents (
  id                               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type                             text NOT NULL
    CHECK (type IN ('security_incident', 'exploited_vulnerability')),
  severity                         text NOT NULL DEFAULT 'high'
    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title                            text NOT NULL,
  description                      text,
  aware_at                         timestamptz NOT NULL DEFAULT now(),

  -- Lifecycle status across the three submission windows.
  status                           text NOT NULL DEFAULT 'detected'
    CHECK (status IN (
      'detected',
      'early_warning_submitted',
      'incident_report_submitted',
      'final_report_submitted',
      'closed'
    )),

  -- Affected products (text array of product uuids). Kept denormalised
  -- because a single incident can touch multiple products; a join table
  -- isn't worth it at MVP scale.
  affected_product_ids             uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],

  -- Optional link back to the vulnerability that triggered the incident
  -- (populated automatically when a vuln is flagged actively-exploited).
  linked_vulnerability_id          uuid REFERENCES public.vulnerabilities(id) ON DELETE SET NULL,
  linked_cve_id                    text,

  -- Per-phase submission timestamps (drive the UI countdown rings).
  early_warning_submitted_at       timestamptz,
  incident_report_submitted_at     timestamptz,
  final_report_submitted_at        timestamptz,
  closed_at                        timestamptz,

  -- Per-phase body text ("what did we report at 24h / 72h / 14d").
  early_warning_notes              text,
  incident_report_notes            text,
  final_report_notes               text,

  -- User-notification composer (Article 14 obliges manufacturers to inform
  -- affected users of incidents and available mitigations).
  user_notification_sent_at        timestamptz,
  user_notification_content        text,

  created_by                       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_org_id      ON public.incidents (org_id);
CREATE INDEX idx_incidents_status      ON public.incidents (status);
CREATE INDEX idx_incidents_aware_at    ON public.incidents (aware_at DESC);
CREATE INDEX idx_incidents_vuln_link   ON public.incidents (linked_vulnerability_id)
  WHERE linked_vulnerability_id IS NOT NULL;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.tg_incidents_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER incidents_touch_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.tg_incidents_touch_updated_at();

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidents_select" ON public.incidents
  FOR SELECT USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "incidents_insert" ON public.incidents
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "incidents_update" ON public.incidents
  FOR UPDATE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );

CREATE POLICY "incidents_delete" ON public.incidents
  FOR DELETE USING (
    org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
  );
