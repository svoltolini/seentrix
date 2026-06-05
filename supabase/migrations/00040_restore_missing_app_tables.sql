-- =============================================================================
-- 00040: Restore app tables missing from non-production databases
--
-- Same root cause as 00039: these tables existed on the original production
-- database but were created outside this repo's migration files, so a freshly
-- provisioned database (staging) lacked them. The missing rate_limits table in
-- particular blocked 00039's rate-limit functions, and the broader gap means
-- Academy completion, Stripe webhook idempotency, the multiplayer "padaland"
-- demo, and checklist-item comments would all fail on a fresh DB.
--
-- Definitions copied verbatim from production. IF NOT EXISTS / idempotent
-- guards make this safe to run against production (where they already exist).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- rate_limits — DB-backed rate-limit counters (fallback to Upstash).
-- Service-role only: RLS enabled with NO policies → denies anon/auth access.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window
  ON public.rate_limits USING btree (key, window_start DESC);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- stripe_events — webhook idempotency ledger. Service-role only.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id     text PRIMARY KEY,
  event_type   text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- academy_completions — per-user lesson completion + certificate.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_completions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lesson_id        text NOT NULL,
  score            numeric NOT NULL CHECK (score >= 0 AND score <= 1),
  attempts         integer NOT NULL DEFAULT 1,
  completed_at     timestamptz NOT NULL DEFAULT now(),
  certificate_hash text NOT NULL,
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_completions_org
  ON public.academy_completions USING btree (org_id);
CREATE INDEX IF NOT EXISTS idx_academy_completions_user
  ON public.academy_completions USING btree (user_id);
ALTER TABLE public.academy_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='academy_completions' AND policyname='academy_completions_select') THEN
    CREATE POLICY "academy_completions_select" ON public.academy_completions
      FOR SELECT USING (org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='academy_completions' AND policyname='academy_completions_insert') THEN
    CREATE POLICY "academy_completions_insert" ON public.academy_completions
      FOR INSERT WITH CHECK (org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid AND user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='academy_completions' AND policyname='academy_completions_update') THEN
    CREATE POLICY "academy_completions_update" ON public.academy_completions
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- academy_quiz_attempts — every quiz attempt (pass or fail).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lesson_id    text NOT NULL,
  score        numeric NOT NULL CHECK (score >= 0 AND score <= 1),
  passed       boolean NOT NULL,
  answers      jsonb NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academy_attempts_user_lesson
  ON public.academy_quiz_attempts USING btree (user_id, lesson_id, attempted_at DESC);
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='academy_quiz_attempts' AND policyname='academy_attempts_select') THEN
    CREATE POLICY "academy_attempts_select" ON public.academy_quiz_attempts
      FOR SELECT USING (org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='academy_quiz_attempts' AND policyname='academy_attempts_insert') THEN
    CREATE POLICY "academy_attempts_insert" ON public.academy_quiz_attempts
      FOR INSERT WITH CHECK (org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid AND user_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- padaland_sessions — ephemeral multiplayer demo state, keyed by a 6-char code.
-- Public (anon) full access by design (it's a throwaway demo).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.padaland_sessions (
  code       text PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{6}$'),
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS padaland_sessions_updated_at_idx
  ON public.padaland_sessions USING btree (updated_at DESC);
ALTER TABLE public.padaland_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='padaland_sessions' AND policyname='padaland anon select') THEN
    CREATE POLICY "padaland anon select" ON public.padaland_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='padaland_sessions' AND policyname='padaland anon insert') THEN
    CREATE POLICY "padaland anon insert" ON public.padaland_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='padaland_sessions' AND policyname='padaland anon update') THEN
    CREATE POLICY "padaland anon update" ON public.padaland_sessions FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='padaland_sessions' AND policyname='padaland anon delete') THEN
    CREATE POLICY "padaland anon delete" ON public.padaland_sessions FOR DELETE USING (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS padaland_sessions_touch_trg ON public.padaland_sessions;
CREATE TRIGGER padaland_sessions_touch_trg
  BEFORE UPDATE ON public.padaland_sessions
  FOR EACH ROW EXECUTE FUNCTION public.padaland_sessions_touch();

-- -----------------------------------------------------------------------------
-- product_checklist_item_comments — append-only comment thread on a checklist
-- item (same contract as the conformity-step comments).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_checklist_item_comments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  body              text NOT NULL CHECK (length(trim(body)) > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklist_item_comments_lookup
  ON public.product_checklist_item_comments USING btree (checklist_item_id, created_at);
ALTER TABLE public.product_checklist_item_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_checklist_item_comments' AND policyname='checklist_item_comments_select') THEN
    CREATE POLICY "checklist_item_comments_select" ON public.product_checklist_item_comments
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.products
                WHERE products.id = product_checklist_item_comments.product_id
                  AND products.org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_checklist_item_comments' AND policyname='checklist_item_comments_insert') THEN
    CREATE POLICY "checklist_item_comments_insert" ON public.product_checklist_item_comments
      FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.products
                    WHERE products.id = product_checklist_item_comments.product_id
                      AND products.org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid)
      );
  END IF;
END $$;
