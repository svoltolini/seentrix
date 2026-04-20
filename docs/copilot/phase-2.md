# Seentrix Copilot — Phase 2 design

**Status:** Approved (2026-04-20) — building Pillars 1 + 2 first
**Successor to:** Phase 1 (shipped, commit `91d6d29`, docs/copilot/design.md)
**Last updated:** 2026-04-20

---

## 1. Where we are today

Phase 1 shipped a grounded, EU-hosted, rate-limited chat assistant that
answers CRA questions with citations. It's good at explaining the
regulation and the Seentrix product, after the §7 audit closed the
worst hallucinations.

What it still can't do:
- Know which **product** / **page** / **organisation** the user is on
  while asking.
- Answer in **German** with German reference passages (Mistral
  translates at inference time, but the retrieval context stays
  English).
- **Take actions** — deep-link to a screen, draft content for a form,
  update a record.
- **Learn** from what worked — there is no feedback loop at all right
  now.

Phase 2 is about closing those gaps — and doing it in a way that turns
the Copilot from "a better way to read documentation" into "a
genuinely useful colleague".

---

## 2. Non-goals for Phase 2

So we know the edge of the scope up front:

- **No SBOM generation** — that's a different product. If we ever do
  it, it's a side project, not a Copilot feature.
- **No vision / image understanding** — Mistral Large 2 is text-only;
  the vision-capable model (Pixtral) has a different EU deployment
  story and we haven't investigated it yet.
- **No voice input** — nice to have, but the ROI on a B2B compliance
  product is low. Revisit after we see adoption numbers.
- **No customer-facing public widget** on the marketing site — abuse
  surface needs its own threat model.
- **No custom fine-tuning** — we stay on the off-the-shelf model; any
  intelligence improvements come from better retrieval and better
  prompts.
- **No multi-agent / "autonomous" flows** — one turn, one user
  confirmation for any mutation. Humans stay in the loop.

---

## 3. The seven Phase 2 pillars

Pillars are ranked by expected value-per-engineering-day. I'd ship
them roughly in order (1 → 7), but each pillar is independent so we
can re-shuffle.

### Pillar 1 — Context awareness (2–3 days)

The server already accepts `page` and `product` in the request body
(see `/api/copilot/chat/route.ts`). Phase 1 just doesn't wire the
client to populate those fields with anything useful.

**What ships:**

- When the user asks a question from `/app/products/abc-123/sbom`, the
  request includes:
  ```ts
  page:    { title: "SBOM", path: "/app/products/abc-123/sbom" }
  product: { id: "abc-123", name: "Acme Gateway", type: "iot", ... }
  ```
- The system prompt surfaces this as "User context" so answers like
  "What's my next step?" map to the current product, not a generic
  answer.
- Server also fetches a tiny **situation summary** per product: active
  SBOM id, open critical vulns, days since last SBOM, DoC status. It
  joins that into the prompt.
- Client side: a single `useCopilotContext()` hook read by the sheet.
  Every app layout writes into it.

**Why it matters:**

It's the difference between "here's what Article 13 says" and "here's
what Article 13 says, and on *this product* you're missing a DoC and
have 2 critical vulns — want me to walk you through fixing both?".
This is the single biggest perceived-intelligence upgrade per hour of
work.

**What changes in the product doc:**

Nothing — the existing `Products`, `SBOM`, etc. sections are already
the grounding. We're just feeding the model which specific product
the question is about.

### Pillar 2 — Feedback loop (1–2 days)

Without this, we're flying blind. Ship this alongside pillar 1.

**What ships:**

- Thumbs-up / thumbs-down on every assistant message. No-op if the
  user never clicks.
- When a user clicks 👎, an optional freetext box opens: "What went
  wrong?"
- Captured server-side in a new `chat_feedback` table. A nightly (or
  weekly) job summarises into a simple dashboard for us:
  - rate of 👍 vs 👎
  - questions that returned no retrieved passages (KB gaps)
  - conversations where the user asked a follow-up containing "no"
    or "that's wrong" — a heuristic signal
- When the model returns "I'm not sure…", we log the query as a
  candidate for corpus expansion.

**Why it matters:**

You can't fix what you can't see. Every 👎 becomes a sprint-ready
task: "add this passage to the corpus" or "tighten this rule in the
system prompt". It's also the substrate for later evals.

### Pillar 3 — Basic agentic tools (3–4 days)

Tool calling via Mistral's OpenAI-compatible function-calling API,
exposed through the AI SDK.

**What ships in v1 (no mutations):**

| Tool | Signature | What it does |
|---|---|---|
| `searchProducts` | `(query: string)` | Returns `{id, name, type}[]` for the org. Lets "my router product" resolve to a real id. |
| `getProductStatus` | `(productId: string)` | SBOM freshness, vulnerability counts by severity, DoC status, conformity step progress. |
| `listOverdueItems` | `()` | Everything the org needs to catch up on. |
| `findCve` | `(cveId: string)` | Passes through to OSV. |
| `linkToPage` | `(path: string, label: string)` | UI primitive — renders as a clickable button in the chat. |
| `explainTerm` | `(term: string)` | Glossary lookup. |

No tool writes to the database. The worst a tool call can do is show
the user a link or expose information they already have permission to
see (RLS is enforced on every query).

**Why it matters:**

Turns "here's what you should do" into "I did the lookup for you —
here's what's true, want me to open it?". The deep-link buttons are
what make the chat feel like a proper copilot instead of a search
result.

### Pillar 4 — Draft tools (5–7 days) **← where the real product value lives**

This is where Copilot stops being a chatbot and starts saving the
customer real time. Each tool returns markdown the user reviews and
applies manually; none of them writes directly to the database in
Phase 2.

| Tool | What it drafts |
|---|---|
| `draftDeclarationOfConformity` | Annex IV body built from the product fields + harmonised standards applied. Manufacturer pastes into our DoC generator. |
| `draftTechnicalDocumentation` | Annex VII skeleton — lists sections, fills what we know (product description, risk assessment summary pulled from the product, SBOM summary). |
| `draftUserInformation` | Annex II end-user info sheet. |
| `draftIncidentNarrative` | The three-phase Article 14 text. Pulls from the incident record + the linked vulnerability. |
| `draftVulnerabilityResponse` | Short coordinated-disclosure acknowledgement email for a researcher who filed via PSIRT. |
| `draftSupportNotice` | Public notice that a patched vulnerability has been disclosed (post-patch advisory). |

**Why it matters:**

Every customer conversation comes back to "I don't know how to
write this document". Give them a first draft in 3 seconds and the
time-to-first-DoC drops from weeks to the afternoon. This is the
clearest path to Copilot being a sales lever, not just a support
feature.

**Safety model:**

- Draft tools are read-only — they produce text, nothing more.
- Every draft ends with `Review before use. Not legal advice.`
- The user copies the draft into the real form; Seentrix's existing
  DoC generator stays the canonical path for actually issuing the
  document.

### Pillar 5 — German corpus (deferred)

Deferred out of Phase 2 — see §10 decision 3. The CRA is a single
EU-wide regulation with English as the effective working language
for compliance filings; Mistral translates inline at acceptable
quality. Revisit if a DACH customer specifically asks for German
citations.

### Pillar 6 — Onboarding + empty-state copilot hooks (2 days)

Turn the existing empty states around the app into Copilot prompts.

**What ships:**

- Every empty state (no products, no SBOM, no incidents, DoC not
  issued) gets a contextual "Ask Copilot: *the right question*" chip.
- Product-detail pages with noteworthy state (e.g. overdue SBOM, open
  critical vuln, unissued DoC) show a subtle banner: *"Copilot found
  3 things you might want to act on"* → opens the drawer pre-seeded
  with the relevant question.
- Onboarding screens pair the feature tour with a Copilot prompt
  ("Not sure what an SBOM is? Ask Copilot") — replaces a chunk of the
  Academy micro-copy.

**Why it matters:**

Most new users don't know what they don't know. Surfacing Copilot as
the answer to "I'm stuck" is how usage goes from "sometimes" to
"every workflow".

### Pillar 7 — Conversation history + resume (2 days)

The data is already in `chat_sessions` + `chat_messages`. The UI just
doesn't surface it.

**What ships:**

- A "Past conversations" pane in the Copilot drawer header — a small
  icon that expands into a list of the last ~20 sessions for the
  user.
- Click a session → the transcript loads into the drawer, composer
  is ready to continue.
- Rename or delete a single session.
- Search across the user's own history (text search on
  `chat_messages.content`).

**Why it matters:**

Prevents the "I asked about this yesterday, where did it go?"
frustration. Small quality-of-life upgrade that compounds with Pillar
4 (users who drafted a DoC can find it again a week later).

---

## 4. Stretch pillars (Phase 2.5 / Phase 3 candidates)

Not in Phase 2 unless you specifically want them — flagged so we know
what's on the table.

- **Mock audit mode** — Copilot role-plays a market-surveillance
  authority asking questions of the org. Great for investor demos.
- **Gap analysis report** — one-click "you're missing these things
  for CRA readiness" with a downloadable PDF.
- **Share a conversation** — a public short-lived URL that renders a
  read-only transcript; useful for email to a colleague or an
  auditor.
- **Slash commands** (`/doc`, `/sbom`, `/incident`) — keyboard-first
  power users.
- **Voice input** — browser Speech API; 1 day of work, low priority.
- **Inline Copilot at the form level** — open the drawer with the
  form's schema as context ("help me fill this out"). Dependent on
  pillars 1 and 3.
- **Action tools that mutate data** — `updateVulnStatus`,
  `createIncidentFromVuln`, etc. Requires a confirmation UX + audit
  log hooks. Low-risk candidates only; never auto-execute.
- **Public /ai demo widget** — a rate-limited, anonymous version on
  `seentrix.com/ai` that lets a prospect try it without signing up.
  Needs its own prompt-injection threat model.

---

## 5. Data model changes

Small additions; no migrations to existing tables.

```sql
-- 00035: Copilot feedback + tool calls

create table chat_feedback (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references chat_messages(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        smallint not null check (rating in (-1, 1)),
  comment       text,
  created_at    timestamptz not null default now()
);

-- Audit trail for tool calls — one row per tool invocation. Useful for
-- understanding how often each tool is hit and catching regressions.
create table chat_tool_calls (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references chat_messages(id) on delete cascade,
  tool_name      text not null,
  arguments      jsonb,
  result_summary text,
  latency_ms     int,
  created_at     timestamptz not null default now()
);
```

Both get RLS policies scoped per user via the underlying session.

Also a **kb_chunks** extension for Pillar 5:
```sql
-- kb_chunks already has `language` via the parent kb_documents row,
-- so no schema change is needed — we just add more chunks.
```

---

## 6. Prompt-engineering plan

Each pillar touches the system prompt. Rolled up into a single post-
pillar-4 prompt revision.

- Pillar 1 adds: `## Current context` block with product / page data.
- Pillar 3 adds: tool descriptions + "prefer calling a tool over
  guessing about the user's data" rule.
- Pillar 4 adds: a strict `## Drafting rules` section — must use the
  user's real data, must label drafts `Review before use`.
- Pillar 5 doesn't change the English prompt; the German prompt gets
  the same rules translated.

The system prompt stays one file, built per-turn — no provider-side
state, no long-lived tool registration.

---

## 7. Rollout sequencing

Assuming one engineer:

| Week | Ship |
|---|---|
| **Week 1** | Pillar 1 (context-awareness) + Pillar 2 (feedback + admin review page). Quick wins, one tight migration (`chat_feedback`), instant observability upside. |
| **Week 2** | Pillar 3 (agentic lookup tools — `searchProducts`, `getProductStatus`, `linkToPage`, `findCve`, `listOverdueItems`, `explainTerm`). All read-only; no mutations. |
| **Week 3** | Pillar 4, draft #1 — `draftDeclarationOfConformity`. Gated to paid tiers. |
| **Week 4** | Pillar 4, drafts #2 + #3 — `draftIncidentNarrative` and `draftVulnerabilityResponse`. |
| **Week 5** | Pillar 6 (onboarding + empty-state hooks) + Pillar 7 (conversation history). |

Five weeks wall-clock. Each pillar is independently shippable, so
slips in any one don't block the others. Pillar 5 (German corpus) is
deferred.

---

## 8. Cost check

Pillars 1, 2, 6, 7 add effectively zero to per-turn cost.

Pillar 3 (tools) adds ~200 extra output tokens per turn on average
(tool-call JSON) → ~€0.003 per turn extra. Negligible.

Pillar 4 (drafts) can balloon to ~1.5 K output tokens per draft turn
→ ~€0.025 each. Still cheap; drafts are the single highest
return-per-token we can generate.

Pillar 5 (German corpus) is a one-time embedding cost of ~€1.

**New monthly estimate at 100 paying customers** (150 msg/mo each, 10%
of turns invoking a draft):
- Base chat: €120 (unchanged)
- Drafts: 100 × 15 drafts × €0.025 = €38
- **Total ~€160/mo** — still well under 1% of revenue.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Draft tools hallucinate legal content the user copies into a binding DoC. | Every draft ships with "Review before use — not legal advice." Also: the DoC generator keeps doing its own validation; Copilot drafts go into the editable form, not the signed artefact. |
| Tool calls leak cross-tenant data. | Every tool runs through the authenticated Supabase client — RLS is the gate, not the tool implementation. |
| Cost runaway from someone spamming draft tools. | The existing plan quota already counts draft turns; Pro = 200/mo total. No separate allowance. |
| German translation quality is bad. | External native-speaker review before Pillar 5 ships. |
| Retrieval misses on questions about the user's data because we're retrieving against the KB not the user's rows. | Tools fill this gap — Copilot queries the live DB when the question is data-shaped. |
| Latency grows with more tools / bigger prompts. | Streaming masks most of it; if p50 first-token crosses 2s we cut retrieval top-k or trim the system prompt. |

---

## 10. Decisions (locked in 2026-04-20)

1. **Draft scope.** First three draft tools to ship:
   **`draftDeclarationOfConformity`**, **`draftIncidentNarrative`**,
   **`draftVulnerabilityResponse`**. Other candidates (technical doc,
   user info sheet, support notice) queued for Phase 2.5.

2. **Feedback UI.** Inline thumbs-up / thumbs-down icons under every
   assistant message — outlined when idle, filled-tint when pressed.
   Icons live at `public/icons/thumbs-{up,down}-stroke-rounded.svg`.
   A click on 👎 reveals an optional "what went wrong?" comment box.
   Capture pipeline:
   - `chat_feedback` row per rating, linked to the message id.
   - Admin-only review page at **`/app/admin/copilot`** listing
     recent 👎 turns with the user question, full answer text,
     which KB sections were retrieved, and the freetext comment.
     Also lists "no-retrieval" turns (KB-gap candidates).
   - Future (not in this phase): weekly email digest to
     `support@seentrix.com` summarising 👎 rate, top questions
     flagged, KB gaps.

3. **German corpus — deprioritised.** The CRA is a single EU-wide
   regulation published in all official languages; English is the
   effective working language for compliance filings. We'll keep the
   UI localised to German but skip a parallel German KB for now;
   Mistral translates inline with acceptable quality. Revisit when
   DACH customers specifically ask for it.

4. **Agentic tool gating.** Free tier gets lookup + link tools
   (`searchProducts`, `getProductStatus`, `linkToPage`, `findCve`,
   `listOverdueItems`, `explainTerm`). Paid tiers unlock the draft
   family. Clean upsell hook.

5. **Conversation retention — tier-laddered.** Matches the pattern
   we already use for the activity log:
   | Plan         | Copilot transcript retention |
   |--------------|-----------------------------:|
   | Free         |                       7 days |
   | Professional |                      90 days |
   | Business     |                     180 days |
   | Enterprise   |                    365 days |
   Displayed in Settings → Account and in the DPA / Privacy Policy.

6. **Onboarding hooks — shipping now** as Pillar 6. Touches signup →
   first-product flow + Academy welcome + empty states across the
   app.

7. **Agent should do more for the user.** Interpreted as: lean
   aggressively into agentic tools and drafts (Pillars 3 + 4). Don't
   cap the scope; every safe tool we can add is worth adding.

---

## 11. What this unlocks in marketing

Short phrases I'd want on `/ai` and the landing page once Phase 2
ships:

- "Knows which product you're talking about."
- "Drafts your DoC in 30 seconds from the data you already have."
- "Auf Deutsch. Wirklich auf Deutsch, nicht nur übersetzt."
- "One click to jump to the screen Copilot suggests."
- "Every answer rates itself — we see what's not working."

Each of these maps to one of the pillars. Good test: if I can't write
a marketing line for a pillar, the pillar isn't big enough.
