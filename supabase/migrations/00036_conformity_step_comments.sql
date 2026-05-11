-- =============================================================================
-- 00036: Conformity step comment thread (append-only)
--
-- Replaces the single `notes` text column on `product_conformity_steps` with a
-- proper per-step conversation log. Each comment captures the author, the
-- body, and an immutable created_at — so when a compliance officer marks a
-- step "complete" with a note, that note becomes a durable audit-log entry
-- rather than a value that can be overwritten by the next status change.
--
-- The existing `notes` column on `product_conformity_steps` is left in place
-- as a backwards-compatible holdover. The app code stops reading from it
-- once this migration ships; future migrations may drop the column.
-- =============================================================================

CREATE TABLE public.product_conformity_step_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  step_key    text NOT NULL,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  body        text NOT NULL CHECK (length(trim(body)) > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conformity_step_comments_lookup
  ON public.product_conformity_step_comments (product_id, step_key, created_at ASC);

ALTER TABLE public.product_conformity_step_comments ENABLE ROW LEVEL SECURITY;

-- Select: anyone in the same org as the product can read the thread.
CREATE POLICY "conformity_step_comments_select"
  ON public.product_conformity_step_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_step_comments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Insert: any org member can post a comment, and the user_id must match the
-- authenticated user (no impersonation). Role-based write gating happens in
-- the server action — keeping the RLS check simple here means anyone who can
-- already write to product_conformity_steps can also comment, which mirrors
-- the workflow.
CREATE POLICY "conformity_step_comments_insert"
  ON public.product_conformity_step_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_conformity_step_comments.product_id
        AND products.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    )
  );

-- Append-only: no UPDATE or DELETE policies. Comments cannot be edited or
-- removed once posted — this is intentional. A compliance log that can be
-- silently rewritten isn't an audit log. If a comment needs to be retracted,
-- post a follow-up comment explaining the retraction.

COMMENT ON TABLE public.product_conformity_step_comments IS
  'Append-only audit log of comments on individual conformity workflow steps. '
  'Captures author + timestamp per comment. No edit / delete policies — '
  'compliance audit trails are immutable.';
