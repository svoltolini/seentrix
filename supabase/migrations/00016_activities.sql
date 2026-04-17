-- Activity log for tracking all mutations in the system
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  actor_name text,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_org_created ON public.activities (org_id, created_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Members can read their org's activities
CREATE POLICY activities_select ON public.activities
  FOR SELECT USING (org_id = (auth.jwt()->'app_metadata'->>'org_id')::uuid);

-- Members can insert activities for their org
CREATE POLICY activities_insert ON public.activities
  FOR INSERT WITH CHECK (org_id = (auth.jwt()->'app_metadata'->>'org_id')::uuid);
