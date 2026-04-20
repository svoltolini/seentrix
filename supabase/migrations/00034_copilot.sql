-- =============================================================================
-- 00034: Seentrix Copilot
--
-- Introduces the AI copilot feature — a CRA-specialist assistant that reads
-- retrieved passages from a global knowledge base and answers questions for
-- the current user. Four tables:
--
--   kb_documents — one row per ingested source document (CRA, ENISA, etc.)
--   kb_chunks    — embedded chunks of those documents (vector(1024))
--   chat_sessions  — per-user conversation threads
--   chat_messages  — append-only transcript of each turn (user, assistant,
--                    tool calls/results)
--
-- kb_* tables are global (read-only for any authenticated user) because the
-- knowledge base is the same for every customer. chat_* tables are scoped
-- per org_id using the same JWT-based RLS convention as the rest of the
-- schema (see 00021_incidents.sql).
--
-- Requires pgvector. Dimension 1024 matches Mistral's `mistral-embed`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- kb_documents — source-document registry. One row per ingested doc (the CRA
-- text, each ENISA guidance PDF, each Academy lesson, each legal page).
-- -----------------------------------------------------------------------------
CREATE TABLE public.kb_documents (
  id           text PRIMARY KEY,                           -- e.g. "cra", "enisa-vuln-2024"
  title        text NOT NULL,
  language     text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'de')),
  source_url   text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

-- Every authenticated user can read the KB registry.
CREATE POLICY "kb_documents_select" ON public.kb_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- kb_chunks — embedded passages. Retrieval uses cosine similarity against
-- the 1024-dim vector produced by `mistral-embed`.
-- -----------------------------------------------------------------------------
CREATE TABLE public.kb_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id          text NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  section         text,                                   -- "Article 13(2)", "Annex I(1)(a)", "Lesson: SBOM basics"
  body            text NOT NULL,
  embedding       vector(1024),
  token_count     int,
  -- Hash lets the ingestion script upsert idempotently: if the source text
  -- hasn't changed, we don't re-embed.
  section_hash    text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_id, section_hash)
);

-- IVFFlat cosine index for fast similarity search. `lists = 100` is a good
-- default for ~1000-10000 rows (our initial corpus size).
CREATE INDEX idx_kb_chunks_embedding ON public.kb_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_kb_chunks_doc_id ON public.kb_chunks (doc_id);

ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_chunks_select" ON public.kb_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- chat_sessions — one row per conversation thread. `title` auto-generated
-- from the first user message so the sidebar "recent chats" list is scannable.
-- -----------------------------------------------------------------------------
CREATE TABLE public.chat_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_org_user ON public.chat_sessions (org_id, user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.tg_chat_sessions_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_sessions_touch_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_chat_sessions_touch_updated_at();

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions are scoped both per-org and per-user: we don't want one member
-- of an org to read another member's chat history.
CREATE POLICY "chat_sessions_select" ON public.chat_sessions
  FOR SELECT USING (
    org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_insert" ON public.chat_sessions
  FOR INSERT WITH CHECK (
    org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE USING (
    org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND user_id = auth.uid()
  ) WITH CHECK (
    org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_delete" ON public.chat_sessions
  FOR DELETE USING (
    org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
    AND user_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- chat_messages — append-only turn-by-turn transcript.
-- -----------------------------------------------------------------------------
CREATE TABLE public.chat_messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role               text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content            text NOT NULL,
  tool_calls         jsonb,                              -- assistant messages that invoked tools
  tool_name          text,                               -- for role='tool' result messages
  retrieved_sections text[] NOT NULL DEFAULT ARRAY[]::text[],  -- which KB sections we cited
  token_usage_in     int,
  token_usage_out    int,
  latency_ms         int,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages (session_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: inherit the session's visibility via a subquery. We already scope
-- by org_id + user_id at the session layer, so this stays consistent.
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- match_kb_chunks — RPC used by the chat route to retrieve top-k chunks
-- by cosine similarity. Exposed via PostgREST so the server route can call
-- it with the service role key; the function body runs with SECURITY DEFINER
-- so it can read kb_chunks without per-request RLS (safe because the table
-- is globally readable anyway).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  query_embedding vector(1024),
  match_count     int DEFAULT 8,
  filter_language text DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  doc_id     text,
  section    text,
  body       text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.doc_id,
    c.section,
    c.body,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.kb_chunks c
  JOIN public.kb_documents d ON d.id = c.doc_id
  WHERE filter_language IS NULL OR d.language = filter_language
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_kb_chunks TO authenticated;
