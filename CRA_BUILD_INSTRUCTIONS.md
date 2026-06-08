# Seentrix CRA Toolkit — Build Instructions (for the implementer)

This is the authoritative, build-ready spec to turn Seentrix into a complete CRA
compliance toolkit. Build **one phase at a time**; finish + test + deploy to
staging + get sign-off before starting the next. Companion docs:
`CRA_COMPLETENESS_PLAN.md` (the gap matrix / rationale) and
`cra-obligations-research.md` (the legal source of truth, verbatim citations).

> Decisions locked: **Excalidraw** is the diagram tool (free, MIT, user-friendly,
> supports real-time collaboration via a self-hosted room server). All six phases
> will be built over time. **Article 14** reporting is its own phase. The
> **CRA readiness dashboard** is built **last** (capstone).

---

## 0. Project conventions the implementer MUST follow

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4
· Supabase (Postgres + RLS + Storage) · next-intl (`localePrefix: "never"`,
locales `en/de/fr/it`).

**Workflow & gates (every phase):**
- Branch off `develop`, work on `develop`, deploy to `staging.seentrix.com`. Do
  **not** merge to `main`/production without explicit user approval.
- All four must be green before deploy: `npm run lint`, `npx tsc --noEmit`,
  `npx vitest run`, and a CI-env `npm run build` (use the documented CI dummy env
  vars). Add tests for new logic.
- Apply Supabase DDL via migrations in `supabase/migrations/NNNNN_*.sql` AND to
  the staging project (`ebaunhihbdsazhobattq`). Production DB migration only at
  promotion time.

**i18n (mandatory):** every user-facing string goes through `t("…")` with keys in
`messages/en/*.json` AND translated into `de/fr/it`. A completeness test
(`src/i18n/completeness.test.ts`) enforces key + ICU-arg parity — keep it green.
Use the CRA glossary (`i18n-glossary.md`) for consistent terminology. New
namespaces must be registered in `src/i18n/request.ts`.

**Design language (mandatory) — use tokens only, never raw hex / Tailwind palette
/ raw font sizes.** Reference:
- Colors: `bg-card` (#FFF surfaces), `text-foreground` (#2C3659 navy body),
  `text-muted-foreground` (#A7AEC1), `bg-primary`/`text-primary` (#066DE6 blue),
  `bg-accent`/`text-accent` (#FF6D00 orange), `text-success` (#4CD964),
  `text-destructive` (#E60019), `text-warning` (orange), `bg-muted` (#F9F9F9),
  `border-border` / `border-border-outline` / `border-strong`, `bg-dark-cta`
  (#2C3659 navy panel) + `text-dark-cta-foreground`. Foreground-on-color:
  `text-primary-foreground` / `text-accent-foreground` (#FFF).
- Typography utilities (size+weight+line-height baked in — never `text-sm`+`font-bold`):
  headings `text-h1`(24/700) `text-h2`(20) `text-h3`(18) `text-h4`(16) `text-h5`(14)
  `text-h6`(13) `text-h6-plus`(11); labels `text-l1..l6`,`text-l6-plus` (600);
  paragraphs `text-p1`(16/400) `text-p1-m`(500) `text-p2`/`text-p2-r`(14)
  `text-p3`/`text-p3-r`(13) `text-p4`/`text-p4-r`(12).
- Radius: `rounded-sm`(8 chips/in-card CTAs) `rounded-md`(10 cards/inputs — DEFAULT)
  `rounded-xl`(15 pills). Shadows: `shadow-card-sm|md|lg` only.
- **Icons:** use the `IconBadge` component for an icon on a colored background —
  rounded-SQUARE (`rounded-md`), FILLED iconsax (`variant="Bold"`), tones
  primary/success/accent/warning/destructive/muted, `fill="soft"|"solid"`, sizes
  sm/md/lg/xl. Plain inline icons use `<Icon name=… />`. NEVER circle icon chips.
- **Primitives:** reuse `Button` (variants default/dark/secondary/accent/outline/
  ghost; sizes sm/default/lg), `Input`, `Textarea`, `Label`, `Select`, `Badge`,
  `DropdownMenu`, `Skeleton`, `ReferenceCard`/`ReferenceBadge` (blue dot-grid hero),
  `IconBadge`. Match existing page shells.
- **Page width:** content wrappers use `mx-auto max-w-[1600px] pb-12` (full-width
  standard, matches dashboard/products/incidents/reports/academy/settings).
- App pages live under `src/app/[locale]/app/...`. Product sub-features under
  `src/app/[locale]/app/products/[productId]/<feature>/` with a `page.tsx` (server)
  + `*-content.tsx` (client) + `actions.ts` ("use server"). Add the feature to the
  product layout's tab nav (`products/[productId]/layout.tsx`).

**Auth/RLS pattern:** server actions resolve org via the existing
`getAuthContext()` pattern; every new table is org-scoped with RLS policies
mirroring existing tables (see `00037_conformity_step_attachments.sql` for the
storage-bucket + attachment reference pattern). Never expose the service-role key
client-side.

**Storage pattern (reuse):** the conformity step attachments feature already
defines a bucket + size cap (2 MB) + MIME allowlist in `conformity/constants.ts`.
Mirror it for new buckets; raise caps where noted.

---

## PHASE 1 — Diagrams (Excalidraw) + Evidence vault

**Why:** Annex VII 2(a) requires architecture/data-flow drawings & system-
architecture description; 1.3 requires hardware photos/illustrations; 6 requires
test reports. Threat modelling is an expected secure-by-design practice. None of
these can be produced today.

### 1.1 Excalidraw integration
- Add dependency `@excalidraw/excalidraw` (MIT). It is **client-only / no SSR** —
  load via `next/dynamic` with `{ ssr: false }` and a `"use client"` wrapper
  (`src/components/diagrams/excalidraw-canvas.tsx`). Copy fonts to `public/` and
  set `window.EXCALIDRAW_ASSET_PATH = "/"` per Excalidraw docs.
- Persistence: store the Excalidraw scene as JSON (`elements` + `appState` +
  `files`) AND an exported PNG (for previews/PDF embedding via
  `exportToBlob`). Save both to Supabase storage + a row in `product_diagrams`.
- Theme the wrapper container to match Seentrix (the canvas chrome stays
  Excalidraw's, but the surrounding page/toolbar/header use our tokens). Pass
  `langCode` from the active locale (Excalidraw ships de/fr/it UI).

### 1.2 Data model (migration `000NN_product_diagrams.sql`)
```
product_diagrams(
  id uuid pk default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  org_id uuid not null,                       -- denormalized for RLS
  type text not null check (type in
    ('architecture','data_flow','environment','threat_model','hardware_layout')),
  title text not null,
  scene_url text,        -- storage path to scene JSON
  preview_url text,      -- storage path to exported PNG
  version int not null default 1,
  created_by uuid, created_at timestamptz default now(), updated_at timestamptz
)
-- RLS: select/insert/update/delete scoped to org_id = caller's org (mirror
-- existing product-scoped policies). Storage bucket `product-diagrams`
-- (private), per-org path prefix, signed URLs for reads.
```

### 1.3 Evidence vault
- Reuse the attachment pattern. New table `product_evidence`:
```
product_evidence(
  id, product_id, org_id,
  category text check (category in
    ('test_report','penetration_test','code_analysis','fuzzing',
     'third_party_test','due_diligence','hardware_photo','other')),
  title text, file_url text, file_name text, file_size int, mime text,
  annex_vii_point text,   -- e.g. '6','1.3','2.c','13.5' for tech-file mapping
  created_by, created_at )
```
- Bucket `product-evidence` (private, per-org). Cap 25 MB; allow PDF, PNG/JPG/WebP,
  SVG, common doc/zip types. Mirror the conformity bucket's RLS.

### 1.4 UI
- New product sub-tab **"Diagrams & Evidence"** (route
  `products/[productId]/diagrams/`). Add to the product layout tab nav, icon
  e.g. `Box`/`hierarchy` (IconBadge primary).
- **Diagrams section:** grid of `bg-card rounded-md shadow-card-sm` cards, each
  showing the PNG preview, a `ReferenceBadge`-style type pill (Architecture /
  Data flow / Environment / Threat model / Hardware layout), title, updated date.
  Card actions: Open (full-screen Excalidraw editor in a sheet/dialog), Rename,
  Delete (confirm dialog like `sbom-delete-dialog`). A primary "New diagram"
  `Button` with a type picker. Empty state: `IconBadge` + "No diagrams yet" +
  CTA (centered — see empty-state spec in §X below).
- **Editor:** full-height dialog/sheet (`max-w-[1600px]`), header with title input
  + Save (`Button` default) + Close; body is the Excalidraw canvas. On Save:
  export scene JSON + PNG, upsert row, toast success.
- **Evidence section:** list of `bg-card rounded-md` rows (icon by category via
  IconBadge, title, file name, size, category pill, download + delete). Upload via
  a dropzone like `sbom-upload-zone` with the category + Annex VII point selector.
- i18n namespace `diagrams` (new file `messages/en/diagrams.json` + de/fr/it),
  registered in `request.ts`. All copy localized.

### 1.5 (Optional sub-phase) Real-time collaboration
- Excalidraw live collaboration needs a WebSocket "room" server
  (`excalidraw-room`, a small Node service) — it is NOT in the npm component.
  Deploy `excalidraw-room` (Docker) on a small host; wire the canvas's collab API
  (`onPointerUpdate`, broadcast scene) to it with a per-diagram room id + signed
  access. Defer to after the single-user editor works end-to-end. Document the
  room-server URL as an env var (`NEXT_PUBLIC_EXCALIDRAW_ROOM_URL`).

### 1.6 Acceptance criteria
- Can create, name, edit, save, reopen, and delete a diagram of each type;
  preview PNG renders in the card; scene reloads exactly on reopen.
- Can upload/download/delete evidence with category + Annex VII point.
- All four locales render; design-token compliant; gates green; deployed +
  visually verified on staging.

---

## PHASE 2 — Structured, versioned Risk Assessment (Art 13 + Annex VII 3)

**Why:** Art 13(3) requires the risk assessment to cover intended purpose,
operational environment, assets, expected lifetime, AND map each Annex I Part I
(2)(a)–(m) item to applicability + how implemented, with justification for any
deemed N/A, and be updated/dated across the support period. Today it's a light
free-text doc.

### 2.1 Data model
```
risk_assessments(
  id, product_id, org_id,
  intended_purpose text, operational_environment text,
  assets_to_protect text, expected_lifetime text,
  status text check (status in ('draft','released')) default 'draft',
  version int default 1, released_at timestamptz, created_by, created_at, updated_at )

risk_assessment_items(            -- one row per Annex I requirement
  id, risk_assessment_id,
  requirement_id text,            -- FK to cra-requirements.ts ids (e.g. 'data_confidentiality')
  applicability text check (applicability in ('applies','not_applicable')),
  implementation text,            -- how it's met (required if 'applies')
  justification text,             -- required if 'not_applicable' (Art 13(4))
  residual_risk text )
```
Seed items from `src/lib/constants/cra-requirements.ts` (Part I ×13 + Part II ×8).

### 2.2 UI (replace the current light Risk Assessment doc form)
- Route stays in the documents area or a dedicated `risk-assessment/` sub-tab.
- Top: context fields (intended purpose, operational environment, assets to
  protect, expected lifetime) — `Textarea`/`Input`, labeled, with `FieldHelp`
  tooltips citing the article.
- **Annex I mapping table:** grouped by Part I / Part II using the existing
  `cra-requirements.ts` metadata (article ref shown). Each row: requirement title +
  article, an Applies / Not applicable toggle (`Select` or segmented control), and
  a conditional `Textarea` ("How it's implemented" when Applies; "Justification"
  when N/A). Pull the conformity checklist status to pre-fill where possible.
- Versioning: a "Release version" action snapshots the assessment (status
  `released`, increments version, stamps `released_at`); a version history list.
- Generated PDF: render the full structured assessment (reuse the pdf pipeline,
  add a richer `risk-assessment` template) — feeds Annex VII point 3.

### 2.3 Acceptance criteria
- All 21 Annex I items present, each markable applies/N/A with required
  implementation/justification; validation enforces justification on N/A.
- Versions snapshot + history; PDF generates in the user's locale; gates green;
  staging-verified.

---

## PHASE 3 — Annex VII technical-file assembler + retention

**Why:** Annex VII requires the full file (8 points). Today docs are separate.
Art 13(13) requires retention 10 years (or support period).

### 3.1 Assembler
- A server action `assembleTechnicalFile(productId, locale)` that gathers, in
  Annex VII order: (1) general description + intended purpose + sw versions +
  hardware photos; (2a) architecture/data-flow/environment diagrams (PNGs from
  Phase 1) + system-architecture description; (2b) SBOM + CVD policy + contact +
  secure-update description; (2c) production/monitoring description; (3) the
  released risk assessment (Phase 2); (4) support-period justification; (5)
  standards applied; (6) test reports (evidence, Phase 1); (7) the DoC. Output one
  branded multi-section PDF (extend the pdf pipeline; section dividers using
  `bg-dark-cta` headers) + a JSON manifest.
- **Coverage manifest UI:** a checklist panel on the tech-doc page showing each
  Annex VII point as Present / Partial / Missing (links to where to fix). This is
  the per-product completeness signal that the Phase-7 dashboard will aggregate.

### 3.2 Retention
- Add `released_at` + `retention_until` (released_at + 10y, or support-period end
  if later) to released technical files & DoCs; surface a "Retained until …"
  badge; block hard-delete of released versions (soft-archive only).

### 3.3 Acceptance criteria
- One-click assembled Annex VII PDF with all available sections in order + a
  manifest of present/missing; retention dates shown; gates green; staging-verified.

---

## PHASE 4 — Article 14 incident & vulnerability reporting workflow

**Why:** From 11 Sep 2026, severe incidents and actively-exploited vulnerabilities
must be reported to CSIRT/ENISA via the Single Reporting Platform on strict
deadlines: early warning ≤24h, notification ≤72h, final report ≤14 days (incidents)
/ ≤1 month after the remedy (vulnerabilities), plus user notification.

### 4.1 Data model
```
report_cases(
  id, org_id, product_id,
  trigger text check (trigger in ('severe_incident','exploited_vulnerability')),
  title, detected_at timestamptz,
  stage text check in ('early_warning','notification','final') ,
  early_warning_due, notification_due, final_due timestamptz,   -- computed from detected_at
  status text check in ('open','submitted','closed') )
report_submissions(
  id, case_id, stage, content jsonb, submitted_at, submitted_by, reference_no )
```

### 4.2 UI
- Build on the existing incident register + the reporting-deadline UI. A "Reporting"
  area listing active cases with a **live countdown** per stage (24h/72h/14d/1-month)
  using `text-warning`/`text-destructive` as deadlines approach.
- Per-stage **notification templates** (early warning / notification / final) for
  both triggers — structured forms producing the content ENISA expects; a
  submission log with timestamps + reference numbers; a user-notification step
  (Art 14(8)).
- ENISA Single Reporting Platform: package/export the submission (PDF + copyable
  fields); link out to the SRP. (No official public API assumed — produce the
  submission package + record it.)

### 4.3 Acceptance criteria
- Create a case from an incident/vuln; clocks compute correct due times from
  `detected_at`; each stage has a template + records a submission; user-notification
  step present; localized; gates green; staging-verified.

---

## PHASE 5 — DoC / CE / Annex II / product identity completeness

### 5.1 Work items
- **EU DoC (Annex V):** verify all 8 mandatory fields are captured; add any missing
  (e.g. notified-body details where applicable, references to standards, signatory).
- **Simplified DoC (Annex VI):** new short-form generator + a hosted public URL per
  product (where the full DoC is reachable).
- **CE marking (Art 30):** guidance panel + an "affixing record" (where/how CE is
  applied: product/packaging/docs/website) stored per product.
- **Annex II user info (items 1–9 incl. 8a–8f):** complete the end-user info
  generator to cover every Annex II item; surface the **support-period end-date**
  as a buyer-facing artifact (Art 13(19)).
- **Product identification (Art 13(15),(16)):** add type/batch/serial fields +
  manufacturer contact, shown on the product and in generated docs.

### 5.2 Acceptance criteria
- DoC has all Annex V fields; simplified DoC + URL works; CE record captured; Annex
  II generator covers 1–9; product identity fields present + flow into docs;
  localized; gates green; staging-verified.

---

## PHASE 6 — Lifecycle & supply-chain records

### 6.1 Work items
- **Conformity route → module records** (A / B+C / H) per Art 32 + Annex VIII:
  capture chosen route, notified-body name/number, certificates (store in evidence),
  surveillance-audit notes.
- **Supply-chain register (Art 23):** upstream suppliers + downstream operators
  (name, address), 10-year retention.
- **Post-market monitoring register (Art 13(7)):** a single exportable register of
  documented cybersecurity aspects/vulnerabilities over time.
- **Per-fix vulnerability advisories (Annex I II.4):** a first-class "advisory"
  artifact per remediated vuln (public disclosure record).
- **Recurring security-test schedule/log (Annex I II.3).**
- **End-of-support notification (Art 13(19)) + corrective-action/recall procedure
  (Art 13(21)).**

### 6.2 Acceptance criteria
- Each record type creatable/exportable; retention surfaced; localized; gates
  green; staging-verified.

---

## CAPSTONE — CRA Readiness Dashboard (build LAST)

**Why last:** it aggregates signals produced by Phases 1–6.

- Per-product page showing the **consolidated master checklist** (from
  `cra-obligations-research.md`) grouped Pre-market / Ongoing / Retention /
  Lifecycle, each item with status **Complete / Partial / Missing / N-A** derived
  from the underlying features (risk assessment released? diagrams present? DoC
  complete? SBOM current? reporting SOP set? etc.) and a deep link to fix each gap.
- A top **readiness % ring** per product + an org-level rollup on the main
  dashboard. Use `text-success`/`warning`/`destructive` for status; IconBadge
  rounded-square; `shadow-card-*` cards; full-width `max-w-[1600px]`.
- Acceptance: status reflects real data; clicking an item routes to the right
  tool; localized; gates green; staging-verified.

---

## X. Shared UI specs (apply everywhere)

- **Empty states:** centered column — `IconBadge` (lg, tone by context) on top,
  `text-h4` heading, `text-p3 text-muted-foreground` body (max-w-sm), then a
  primary `Button` CTA. (Fix existing empty states where the icon isn't centered.)
- **Cards:** `bg-card rounded-md shadow-card-sm` (or `-md` for emphasis), `p-6`,
  `border border-border` where a hairline is needed.
- **Section headers:** `text-h4 text-foreground`; sub-text `text-p3 text-muted-foreground`.
- **Pills/badges:** `ReferenceBadge` for hero pills; small status pills use
  `rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase` with tone
  bg/text at /10–/15 opacity.
- **Destructive actions:** confirm dialog; `Button variant="..."` with destructive
  styling; never green.
- **Tooltips/help:** reuse `FieldHelp` (title/body/reference) with article
  citations from the research doc.
- **Toasts:** reuse the existing `useToast`.

## Y. Definition of done (per phase)
1. Feature works end-to-end for all stated acceptance criteria.
2. EN/DE/FR/IT complete; completeness test green.
3. Design-token compliant (no raw hex/palette/font-size; IconBadge for icon chips).
4. `lint` + `tsc` + `vitest` + CI-env `build` all green; new logic has tests.
5. Migration applied to staging DB; committed to `develop`; deployed to
   staging.seentrix.com; visually verified in the user's browser.
6. NOT promoted to production — await explicit user go-ahead.
