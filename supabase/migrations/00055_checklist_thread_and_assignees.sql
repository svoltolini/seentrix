-- =============================================================================
-- 00055: Checklist item — attachments thread + multiple assignees
--
-- Brings the checklist item up to the same audit-log contract as the
-- conformity workflow steps, and lets more than one person own a task.
--
--   1. `checklist_item_attachments`  — append-only file uploads on a
--      checklist item, mirroring `product_conformity_step_attachments`.
--      (The comment thread `product_checklist_item_comments` already exists
--      from migration 00040.) Plus the `checklist-attachments` bucket.
--
--   2. `checklist_item_assignees`    — join table so one task can be owned
--      by one OR MORE people. Existing single `checklist_items.assigned_to`
--      values are backfilled in; the column is kept for backwards compat but
--      the app reads/writes the join going forward. Assignments are
--      mutable (unlike the comment / attachment log, which is immutable).
--
-- Both new tables get the same RESTRICTIVE write backstop as 00054 so
-- viewers stay read-only at the DB layer.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. checklist_item_attachments
-- ---------------------------------------------------------------------------
CREATE TABLE public.checklist_item_attachments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  storage_path      text NOT NULL,
  file_name         text NOT NULL CHECK (length(trim(file_name)) > 0),
  mime_type         text NOT NULL,
  size_bytes        integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 2097152),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_item_attachments_lookup
  ON public.checklist_item_attachments (checklist_item_id, created_at ASC);

ALTER TABLE public.checklist_item_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_item_attachments_select"
  ON public.checklist_item_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_item_attachments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "checklist_item_attachments_insert"
  ON public.checklist_item_attachments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_item_attachments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Append-only: no UPDATE / DELETE policies — immutable audit trail.

COMMENT ON TABLE public.checklist_item_attachments IS
  'Append-only file attachments on checklist items. 2 MB max, no edit / '
  'delete — compliance audit trail is immutable.';

-- ---------------------------------------------------------------------------
-- 2. checklist_item_assignees (multiple owners per task)
-- ---------------------------------------------------------------------------
CREATE TABLE public.checklist_item_assignees (
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  assigned_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (checklist_item_id, user_id)
);

CREATE INDEX idx_checklist_item_assignees_user
  ON public.checklist_item_assignees (user_id);
CREATE INDEX idx_checklist_item_assignees_item
  ON public.checklist_item_assignees (checklist_item_id);

ALTER TABLE public.checklist_item_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_item_assignees_select"
  ON public.checklist_item_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_item_assignees.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Same-org members may add/remove assignments (role gating in the action +
-- the restrictive backstop below). Assignments are mutable, so unlike the
-- log this table does get INSERT + DELETE.
CREATE POLICY "checklist_item_assignees_insert"
  ON public.checklist_item_assignees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_item_assignees.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

CREATE POLICY "checklist_item_assignees_delete"
  ON public.checklist_item_assignees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = checklist_item_assignees.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Backfill existing single assignments into the join table.
INSERT INTO public.checklist_item_assignees (checklist_item_id, user_id, product_id)
SELECT id, assigned_to, product_id
FROM public.checklist_items
WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. RESTRICTIVE write backstop (viewers read-only) on the new tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
  tables text[] := ARRAY['checklist_item_attachments', 'checklist_item_assignees'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.current_user_can_write())', t || '_rw_ins', t);
    EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.current_user_can_write())', t || '_rw_del', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Storage bucket — checklist-attachments
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checklist-attachments',
  'checklist-attachments',
  false,
  2097152, -- 2 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Folder layout: <org_id>/<product_id>/<item_id>/<file>.
CREATE POLICY "checklist_attachments_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'checklist-attachments'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

CREATE POLICY "checklist_attachments_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'checklist-attachments'
  AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
);

-- No storage DELETE policy — append-only, matches the metadata table.
