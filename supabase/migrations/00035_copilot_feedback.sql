-- =============================================================================
-- 00035: Copilot feedback loop
--
-- Thumbs-up / thumbs-down ratings on assistant messages plus an optional
-- freetext "what went wrong?" comment on 👎. Admin review page pulls from
-- this table + the `no_retrieval` marker on chat_messages to spot KB gaps.
--
-- The table is keyed by the AI SDK's *client-generated* message id rather
-- than a FK to chat_messages.id because the SDK creates the assistant
-- UIMessage id client-side after the stream arrives — the server never
-- gets that id back. We also snapshot the question + answer so the admin
-- page stays readable after retention eventually purges chat_messages.
-- =============================================================================

CREATE TABLE public.chat_feedback (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  client_message_id  text NOT NULL,
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- +1 = thumbs up, -1 = thumbs down. Absence of a row means no rating.
  rating             smallint NOT NULL CHECK (rating IN (-1, 1)),
  comment            text,
  -- Snapshot of what the user rated so the admin page keeps working
  -- even after retention eventually purges the chat_messages rows.
  question           text,
  answer             text,
  retrieved_sections text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- One rating per (user, session, message). Re-rating toggles the value.
  UNIQUE (user_id, session_id, client_message_id)
);

CREATE INDEX idx_chat_feedback_rating_created_at
  ON public.chat_feedback (rating, created_at DESC);
CREATE INDEX idx_chat_feedback_session
  ON public.chat_feedback (session_id);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_feedback_select" ON public.chat_feedback
  FOR SELECT USING (
    user_id = auth.uid()
    AND session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_feedback_insert" ON public.chat_feedback
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_feedback_update" ON public.chat_feedback
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_feedback_delete" ON public.chat_feedback
  FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- no_retrieval flag on assistant turns — makes the admin page query trivial.
-- Turns where RAG returned zero passages are KB-gap candidates we want to
-- surface separately from 👎 ratings.
-- -----------------------------------------------------------------------------
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS no_retrieval boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chat_messages_no_retrieval
  ON public.chat_messages (no_retrieval)
  WHERE no_retrieval = true;
