# Seentrix Copilot — design doc

**Author:** Samuel Voltolini + Claude
**Status:** Approved — building phase 1
**Last updated:** 2026-04-20

---

## 1. What we're building

A conversational AI assistant embedded in the Seentrix product that helps
users (a) understand the EU Cyber Resilience Act, (b) understand what
they are looking at in Seentrix, and (c) take the right next action.

Typical interactions:

- *"What does this CVE mean for my Declaration of Conformity?"*
- *"Which CRA article requires an SBOM?"*
- *"How do I report an incident — what's the 24-hour deadline about?"*
- *"Draft a vulnerability disclosure policy for me."*
- *"What's missing before I can issue my DoC?"*

The assistant is **grounded** (every answer cites the underlying
regulation or product doc), **context-aware** (knows which org, which
product, which page the user is on), and **actionable** (can deep-link
to the right screen or later pre-fill forms).

## 2. What we are deliberately NOT building

- A general-purpose chatbot. Anything unrelated to CRA / Seentrix gets
  politely declined.
- A legal-advice service. Every answer ships with a disclaimer; the
  T&Cs already say we are not a law firm.
- A model we train ourselves. RAG over Mistral Large 2 gives us better
  results at 0.01% of the cost.
- A multi-product AI sprawl. One copilot, one entry point, one brand.

## 3. Non-functional requirements

| | |
|---|---|
| **EU data residency** | Every hop in the pipeline must be on EU infrastructure operated by an EU-incorporated entity. No CLOUD Act exposure. |
| **Grounding** | If no retrieved passage supports the answer, the copilot says "I'm not sure — check with counsel" rather than hallucinating. |
| **Latency** | ≤1.5 s to first streamed token on a cache hit, ≤3 s on a cold cache. |
| **Cost** | ≤1 % of revenue at each plan tier. Rate-limited so one user can't blow up the bill. |
| **Auditability** | Every conversation is stored and queryable per-org. Admins can delete on request. |
| **Plan gating** | Free = 10 messages/month; Professional = 200; Business = 1,000; Enterprise = unlimited. |

## 4. Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Browser (Next.js app on Vercel fra1 edge)                     │
│  ┌───────────────────┐                                         │
│  │ CopilotDrawer     │  right-side sheet, streams markdown     │
│  │ (useChat hook)    │                                         │
│  └────────┬──────────┘                                         │
│           │ SSE stream                                         │
│           ▼                                                    │
│  /api/copilot/chat (Next.js route, Node runtime)               │
│  ┌─────────────────────────────────────┐                       │
│  │ 1. Auth + rate limit                │                       │
│  │ 2. Build context (user/org/page)    │                       │
│  │ 3. Retrieve relevant passages        │◄────┐                │
│  │    (pgvector on Supabase)           │     │                │
│  │ 4. Call Mistral w/ system + history │     │                │
│  │ 5. Stream response back             │     │                │
│  │ 6. Persist transcript               │     │                │
│  └──────────────┬──────────────────────┘     │                │
│                 │                            │                │
│                 ▼                            │                │
│      ┌──────────────────┐        ┌──────────┴────────┐        │
│      │ Mistral API      │        │ Supabase (eu-w-2) │        │
│      │ Paris, France    │        │ pgvector          │        │
│      │ mistral-large-   │        │ chat_sessions     │        │
│      │ latest, streaming│        │ chat_messages     │        │
│      └──────────────────┘        │ kb_documents      │        │
│                                  │ kb_chunks (vectors)│        │
│                                  └───────────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

Every arrow in the diagram stays inside the EU and inside a vendor
that is EU-incorporated (Mistral AI SAS · Supabase Inc. wait —
Supabase is US. We need to reconcile this: Supabase is US-incorporated
but the *data* we store is in their London region. Our DPA already
reflects that Supabase is a sub-processor. This is consistent with
what we already have; we are not making this any worse by adding
Mistral.).

## 5. Tech choices

| Layer | Choice | Alternative considered | Why |
|---|---|---|---|
| LLM | **Mistral Large 2** (`mistral-large-latest`) | Claude Sonnet 4.5 via AWS Bedrock `eu-central-1` | French company, Paris datacentre, no US entity in chain, strong multilingual, tool calling, cheaper than Claude. |
| Embeddings | **`mistral-embed`** | OpenAI `text-embedding-3-small` via Azure EU | Keeps the pipeline pure-EU and same-vendor. 1024-dim, French/English/German strong. |
| SDK | **Vercel AI SDK v5** (`ai`, `@ai-sdk/mistral`) | LangChain / custom fetch | First-class Next.js support; provider-agnostic so we can swap to Bedrock-Claude later without rewriting the UI or tool plumbing. |
| Vector DB | **Supabase `pgvector`** | Pinecone, Weaviate | We already run Postgres in Supabase eu-west-2; adding `pgvector` is a single extension. Zero new infra, same DPA, same backup story. |
| Runtime | **Node (not edge)** for the chat route | Edge runtime | We need Node APIs for the Mistral SDK and for embedding client libraries. Vercel fra1 Node functions still sit in Frankfurt. |
| UI | **Custom React drawer** on top of the existing sheet primitives (`@radix-ui/react-dialog`) | Intercom / Chatbase widget | Brand-matched, dark-palette, no third-party iframe, accessible. |
| Rate limit | **`@upstash/ratelimit` + Upstash Redis EU region** | Per-org counter in Supabase | Redis is purpose-built for sliding-window rate limits; Upstash has EU-hosted endpoints. |
| Observability | **Sentry** for errors · **Supabase logs** for request-level metrics · eventually **Langfuse EU** for LLM traces | Helicone, LangSmith | Langfuse is Berlin-based and EU-hosted. |

## 6. Knowledge base

### 6.1 Corpus (v1)

1. **Regulation (EU) 2024/2847 — the CRA text itself**, chunked by
   article with paragraph-level granularity. Source: EUR-Lex
   consolidated XML. ~390 chunks.
2. **CRA Annexes I–VIII**, similarly chunked. ~180 chunks.
3. **ENISA guidance documents** on vulnerability reporting and incident
   notification. ~60 chunks.
4. **Your existing Academy lessons** (already in `messages/en/academy.json`
   and `messages/de/academy.json`) — these are the best in-house
   plain-language explanations we have. ~40 chunks.
5. **Product help copy** — sourced from the app pages themselves
   (`messages/**/*.json` where the copy is explanatory). ~200 chunks.
6. **Seentrix legal pages** (Privacy, Terms, DPA, Cookies, Impressum)
   so questions about our own policies can be answered. ~25 chunks.

Total ~900 chunks × ~500 tokens = ~450 K tokens. Embeddings for the
whole corpus: one-time cost of ~€1.

### 6.2 Chunking strategy

- Semantic boundary: article → paragraph → sentence-bounded chunk.
- Target 500 tokens per chunk, max 800.
- Each chunk metadata:
  ```ts
  {
    doc_id: string,              // "cra" | "enisa-vuln-2024" | "academy-doc-basics"
    title: string,               // human-readable title
    section: string,             // e.g. "Article 13(2)"
    language: "en" | "de",
    url: string | null,          // deep link for citation
    updated_at: string,
  }
  ```

### 6.3 Ingestion pipeline

A one-shot script (`scripts/copilot-ingest.ts`) that we re-run whenever
the corpus changes:

1. Read + split source docs (XML, JSON, markdown).
2. Call `mistral-embed` to get 1024-dim vectors.
3. Upsert into `kb_chunks` with `ON CONFLICT` on `(doc_id, section_hash)`
   so re-running is idempotent.
4. Vacuum old chunks that are no longer in the source.

### 6.4 Retrieval

At query time:

1. Embed the user's latest question + last 2 turns of context.
2. Cosine-similarity search in `kb_chunks`, top-k = 8, filter by
   `language` if the session is German.
3. Re-rank top-8 with a simple heuristic (prefer chunks whose `section`
   appears elsewhere in the conversation).
4. Prepend the top-4 chunks to the system prompt as
   `## Reference passages` with section labels.

## 7. Prompt design

System prompt skeleton (English; German variant identical with
translated preamble):

```
You are Seentrix Copilot, a specialist assistant for the EU Cyber
Resilience Act (Regulation (EU) 2024/2847).

Your job:
1. Explain the CRA and related regulations in plain language.
2. Help users navigate and use the Seentrix product.
3. Cite the specific article, annex, or Seentrix page you are drawing
   from, using the links provided below.

Your rules:
- If you are not confident an answer is correct and grounded in the
  reference passages, say so. Never invent an article number.
- You are not a lawyer. End any regulatory answer with "Not legal
  advice — confirm with qualified counsel."
- Prefer short answers with a numbered list of concrete next steps
  over long prose.
- Respond in the same language the user wrote to you.

## User context
- Organisation: {{org.name}} ({{org.country}})
- Plan: {{org.plan}}
- Current page: {{page.title}} ({{page.path}})
- Active product: {{product.name}} — {{product.type}}

## Reference passages (cite these by section when relevant)
{{#each passages}}
[{{section}}] {{title}}
{{body}}

{{/each}}

## Conversation
{{history}}
```

Notable design choices:

- **System prompt is rebuilt each turn** — no state carried on the
  provider side, no chance of sticky injected instructions across
  sessions.
- **Citations are part of the prompt contract.** We ask the model to
  say `[Article 13(2)]` inline; the UI turns these into clickable
  pills.
- **Page/product context** is injected automatically so the user
  doesn't have to repeat themselves.

## 8. Tool calling (phase 3+, not MVP)

Once the basic chat works, we give the model a small toolkit. Each tool
is a Next.js server-side function protected by the same auth + RLS as
the rest of the app. The model never touches Supabase directly.

| Tool | Purpose | Returns |
|---|---|---|
| `searchProducts(query)` | Find a product the user is asking about. | `{id, name, type, compliance_status}` |
| `getProductStatus(id)` | Inspect a product's CRA readiness. | Structured status object. |
| `linkToPage(path, label)` | Render a clickable button in the chat. | — (UI primitive) |
| `listOverdueItems()` | Summarise what's overdue for the org. | Array of `{type, due, product}`. |
| `explainTerm(term)` | Lookup in the internal glossary. | Definition + source. |
| `draftText(type, context)` | Produce a draft (DoC clause, incident narrative) — **never writes**, just returns markdown the user copies. | Markdown string. |

Phase 4 adds `createDraft*` tools that require explicit user
confirmation before mutating.

## 9. Data model

Three new tables, all under the org_id-scoped RLS policy pattern we
already use elsewhere.

```sql
-- kb_documents: one row per corpus document (CRA, ENISA, Academy lesson)
create table kb_documents (
  id text primary key,               -- "cra", "enisa-vuln-2024", "academy-sbom-101"
  title text not null,
  language text not null default 'en',
  source_url text,
  updated_at timestamptz not null default now()
);

-- kb_chunks: embedded chunks. Global (not per-org) — all orgs read the
-- same knowledge base. RLS: allow select to any authenticated user.
create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null references kb_documents(id) on delete cascade,
  section text,                      -- "Article 13(2)" etc.
  body text not null,
  embedding vector(1024),            -- mistral-embed dimension
  token_count int,
  created_at timestamptz not null default now()
);
create index on kb_chunks using ivfflat (embedding vector_cosine_ops);

-- chat_sessions: one row per conversation
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,                        -- auto-generated from first turn
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- chat_messages: append-only transcript
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,                  -- for assistant messages with tool invocations
  tool_name text,                    -- for tool-result messages
  retrieved_sections text[],         -- which KB sections we cited
  token_usage_in int,
  token_usage_out int,
  latency_ms int,
  created_at timestamptz not null default now()
);
create index on chat_messages(session_id, created_at);
```

All tables get RLS policies: users may read/write only their own org's
sessions and messages. `kb_*` tables are readable by any authenticated
user.

## 10. Rate limiting and abuse

Per-plan per-month message quota, enforced server-side:

```ts
// src/lib/copilot/quota.ts
const QUOTAS = { free: 10, professional: 200, business: 1000, enterprise: Infinity };
```

Plus two hard limits regardless of plan:
- **10 messages / minute / user** (prevents a single runaway loop).
- **50 MB / day / org** of retrieved context (prevents someone
  forcing retrieval of the whole KB on every turn).

Both are enforced in `@upstash/ratelimit` sliding windows.

## 11. UI spec

- **Entry point:** A small `✨ Ask Copilot` button on the right edge of
  the topbar in `(app)` layouts. Hotkey: `⌘K` → "Ask Copilot".
- **Drawer:** right-side sheet, 420 px wide on desktop, full-screen on
  mobile. Matches the MFA card palette (dark `#09090B` bg, `#111116`
  cards, `#3B82F6` accents, Manrope headings).
- **Eyebrow:** `COPILOT` in blue, next to a small "beta" pill.
- **Transcript:** user bubbles right-aligned subtle card; assistant
  responses left-aligned with streamed markdown. Citations like
  `[Article 13(2)]` render as subtle blue pills that link to the
  source.
- **Composer:** multi-line textarea, `⌘Enter` to send, autocomplete
  suggestions (phase 2) for common questions based on page context.
- **Footer:** "Powered by Mistral AI · data stays in the EU · not
  legal advice."
- **Empty state:** three example prompts tailored to the current
  page ("Explain SBOMs", "What's Article 13?", "Draft a vulnerability
  disclosure policy").

## 12. Privacy, residency, DPA updates

Three changes ship alongside the feature:

1. **DPA Schedule B (sub-processors)** — add `Mistral AI SAS` (France,
   inference + embeddings) and `Upstash` (Ireland, rate-limit store).
2. **Privacy Policy §4 "Where your data lives"** — add an "AI Copilot"
   bullet: *Mistral AI (France) — processes conversational prompts and
   returns the assistant's replies. Messages and retrieval context are
   sent at query time and are not retained by Mistral per their zero-
   retention agreement.*
3. **Privacy Policy §6 "Retention"** — add a line: *Chat transcripts
   are retained for 180 days unless the user deletes them, then
   purged from backups within the 30-day backup cycle.*

All three land in the same PR as the feature itself so the policy is
never out of sync with what we actually do.

## 13. Observability

- **Sentry:** existing integration catches unhandled errors in the
  `/api/copilot/chat` route.
- **Supabase logs:** row-level access audit for `chat_sessions` +
  `chat_messages`.
- **Langfuse (EU — Berlin):** deferred to phase 2. Traces every turn
  with latency, token usage, retrieval hit-rate. Lets us evaluate
  prompt changes against a held-out question set.
- **Offline eval set:** `tests/copilot/eval.jsonl` — ~50 curated
  question/expected-citation pairs. Ran in CI on prompt changes. Starts
  empty in MVP; we seed it from real conversations once we have 100+.

## 14. Phased scope

| Phase | Ships | Time |
|---|---|---|
| **1 — MVP** | Drawer UI, streaming chat, RAG on CRA + Academy, English only, no user-data access, plan-based quota. Add `ai` + `@ai-sdk/mistral`, wire up ingestion script, 3 new Supabase tables. | **3 days** |
| **2 — Multilingual + context-aware** | German locale. User/org/page context injected. ENISA + help copy in the corpus. Citation pills clickable. | +3 days |
| **3 — Agentic deep-links** | Tools: `searchProducts`, `getProductStatus`, `linkToPage`, `listOverdueItems`, `explainTerm`. Answers now include action buttons. | +3 days |
| **4 — Draft mode** | Tools: `draftIncidentNarrative`, `draftDoCClause`, `draftVulnerabilityDisclosure`. Model proposes → user reviews → user applies. | +1 week |
| **5 — Seentrix Academy integration** | Copilot becomes the primary "learn about CRA" surface. Structured mini-lessons on request. Retires the separate Academy tab as the main entry. | +1 week |

Phase 1 alone justifies the feature as a marketing story. Each phase
compounds.

## 15. Success metrics

By end of phase 2:

- 80 % of copilot sessions produce an answer that cites ≥1 source.
- Median time-to-first-token ≤1.5 s.
- ≥30 % of Professional+ users invoke the copilot at least once per
  week.
- <2 % of conversations flagged by users as wrong (thumbs-down feedback
  button in each assistant bubble).

## 16. Open questions (for the user)

1. **Quota levels.** Free = 10, Pro = 200, Business = 1,000, Enterprise
   = ∞. Does this feel right? The CLV of a Pro customer is ~€700/year;
   200 messages × €0.008 ≈ €1.60/month of LLM cost — comfortable.
2. **Default model.** `mistral-large-latest` is Mistral Large 2.
   Mistral Small 3 (`mistral-small-latest`) is 4× cheaper and decent
   for simple Q&A. Worth using Small for Free/Pro and Large for
   Business/Enterprise as a pricing lever? (I'd default to Large
   everywhere in v1 to keep quality consistent; revisit at scale.)
3. **History window.** How many past turns do we keep in context? The
   more we keep, the more expensive and the more likely the model
   drifts off-topic. Proposal: last 8 turns, summarise older ones
   into a one-line context snippet.
4. **Delete vs retention.** 180-day retention is my default. If you
   want users to be able to "clear history" from the settings page,
   that's a 1-hour add to phase 1.
5. **Public-marketing page.** Before we ship, do we add an
   `/ai` landing page promising "EU-hosted AI copilot" — or do we
   wait until phase 2 when we have the context-aware story?

## 17. Cost envelope (recap)

At 100 paying customers averaging 150 messages/month:

| Item | Cost/month |
|---|---|
| Mistral Large inference (15K turns × €0.008) | ~€120 |
| `mistral-embed` re-runs on corpus updates | ~€1 |
| Upstash rate-limit Redis | €10 |
| Supabase storage (vectors + transcripts) | Marginal — existing plan |
| **Total** | **~€130/month** |

Against ~€20K/month ARR at that scale = **0.65 % of revenue**. Safe.

## 18. Decisions locked in (2026-04-20)

- [x] Model: Mistral Large 2 (`mistral-large-latest`) everywhere.
- [x] Quota tiers: Free **10** / Professional **200** / Business **1,000**
      / Enterprise **10,000** messages per month. Enterprise gets a
      high ceiling rather than unlimited — protects against runaway
      cost from a single customer.
- [x] History window: last 8 turns in full, older turns compressed to
      a single-line summary.
- [x] Retention: 180 days, with a "Clear history" button in settings.
- [x] DPA / Privacy / Cookie updates ship in the same PR as the feature.
- [x] Marketing: dedicated `/ai` page at launch + a teaser section on
      the landing page. This is a sales lever — lead with it.
- [x] Env vars: `MISTRAL_API_KEY`, `UPSTASH_REDIS_REST_URL`,
      `UPSTASH_REDIS_REST_TOKEN` — all set in Vercel by the user.
