# Seentrix → Complete CRA Compliance Toolkit — Gap Analysis & Implementation Plan

Goal: make Seentrix give an SME manufacturer **every tool** needed to comply with
the EU Cyber Resilience Act (Regulation (EU) 2024/2847) — not just track it, but
produce, store, and assemble every required artifact.

Legal basis throughout: the full obligations research in
`cra-obligations-research.md` (Annexes I, II, III–IV, V–VI, VII, VIII; Articles
13, 14, 23, 28, 30, 32). Key dates: reporting obligations apply **11 Sep 2026**;
full application **11 Dec 2027**.

---

## A. Where Seentrix already is strong (keep)

| Capability | Status | Where |
|---|---|---|
| Annex I essential requirements modeled (Part I ×13, Part II ×8) | ✅ | `src/lib/constants/cra-requirements.ts` |
| Conformity checklist against Annex I (with step attachments, 2 MB, PDF/img/doc) | ✅ | `conformity/` + storage bucket `00037` |
| SBOM upload + component table + vuln severity (CycloneDX/SPDX) | ✅ | `products/[id]/sbom/` |
| Vulnerability tracking + triage | ✅ | `products/[id]/vulnerabilities/` |
| Incident register | ✅ | `incidents/` |
| Vulnerability reports intake (public security page + CVD contact) | ✅ | `security/[orgSlug]`, `vulnerability-reports/` |
| Releases / update history | ✅ | `products/[id]/releases/` |
| Generated docs: DoC, Vuln Disclosure Policy, Incident Report, Risk Assessment, Technical Documentation, End-user Info | ✅ (light) | `documents/`, `lib/pdf/templates/` |
| Product classification / assessment (default vs important/critical) | ✅ | `products/[id]/assess/`, `products/new/` |
| Academy training (11 lessons, 4 languages, audio) | ✅ | `academy/` |
| AI Copilot (CRA-aware, 4 languages) | ✅ | `copilot/` |

## B. Gap matrix — required artifact → current coverage

Legend: ✅ have · ⚠️ partial/weak · ❌ missing

### Pre-market — Technical Documentation (Annex VII)
| Artifact | Status | Gap |
|---|---|---|
| General product description + intended purpose | ⚠️ | intended-purpose/operational-environment not first-class fields |
| **Architecture drawings / system architecture / data-flow diagrams** (pt 2a) | ❌ | no diagramming; free-text only |
| **Hardware photos/illustrations** (external, marking, internal layout) (pt 1.3) | ❌ | only one product image |
| Software component descriptions | ⚠️ | free-text |
| Vulnerability-handling process spec (SBOM, CVD, contact, secure update) | ✅ | assembled from existing features |
| Production & monitoring process documentation (pt 2c) | ❌ | not captured |
| **Risk assessment** included + Annex I applicability mapping (pt 3, Art 13(3)) | ⚠️ | doc is light free-text, not linked to Annex I mapping/justifications |
| Support-period justification (pt 4) | ⚠️ | date captured, justification not |
| Harmonised standards list / alternative solutions (pt 5) | ⚠️ | single free-text field on DoC |
| **Conformity test reports** (pt 6) | ❌ | no test-evidence capture |
| Copy of DoC (pt 7) | ✅ | DoC generator |
| **Assembled Annex VII technical file (single export bundle)** | ❌ | docs are separate, not compiled |

### Pre-market — Conformity, DoC, CE, user info, identification
| Artifact | Status | Gap |
|---|---|---|
| Product classification determination | ✅ | assess flow |
| **Conformity route selection + module records** (A / B+C / H) (Art 32, Annex VIII) | ⚠️ | route shown, but module-specific records/notified-body tracking thin |
| EU DoC (Annex V all 8 fields) | ⚠️ | verify all 8 fields present |
| **Simplified DoC + URL** (Annex VI) | ❌ | not offered |
| **CE marking guidance/affixing record** (Art 30, Annex VIII) | ❌ | not surfaced |
| Annex II user information (items 1–9, incl. 8a–8f) | ⚠️ | end-user sheet exists; verify full Annex II coverage |
| **Support-period end-date displayed at point of purchase** (Art 13(19)) | ⚠️ | tracked, not surfaced as buyer-facing artifact |
| Single point of contact for vuln reporting | ✅ | public security page |
| **Product identification (type/batch/serial) + manufacturer contact labelling** (Art 13(15)(16)) | ❌ | not captured |
| **Third-party component due-diligence records** (Art 13(5)) | ❌ | not captured |
| **Justification for any inapplicable Annex I requirement** (Art 13(4)) | ❌ | checklist has no "N/A + justification" path |

### Ongoing / post-market
| Artifact | Status | Gap |
|---|---|---|
| Updated SBOM as components change | ✅ | re-upload |
| Remediation / patch records | ✅ | vulns + releases |
| **Security test schedule + records** (Annex I II.3) | ❌ | no recurring test log |
| **Vulnerability advisory / public disclosure record per fix** (Annex I II.4) | ⚠️ | not a first-class advisory artifact |
| Post-market vulnerability/cyber register (Art 13(7)) | ⚠️ | spread across vulns; no single register/export |
| Updated, dated risk-assessment versions | ❌ | no versioning |
| **Article 14 reporting workflow** (24h/72h/14d/1-month, ENISA SRP, templates, submission log, user notification) | ⚠️ | incident report doc exists; no deadline-driven workflow/clock/SRP packaging |

### Supply chain, retention, lifecycle
| Artifact | Status | Gap |
|---|---|---|
| **Upstream/downstream operator records, 10-yr** (Art 23) | ❌ | not captured |
| **Retention/archival of tech docs, DoC, updates (10 yr / support period)** (Art 13(13)) | ❌ | no retention model/locking |
| End-of-support user notification mechanism (Art 13(19)) | ❌ | not built |
| Corrective action / recall procedure (Art 13(21)) | ❌ | not built |

---

## C. Embeddable tooling decision

- **Diagramming → draw.io embed mode** (`react-drawio` / iframe `embed.diagrams.net`).
  Best fit for the formal Annex VII "drawings and schemes / system architecture":
  proper network/AWS/UML stencils, exports **PNG-with-embedded-XML** (re-editable),
  data stays client-side — we persist the PNG+XML to Supabase storage. Used for:
  architecture diagrams, data-flow diagrams, environment/deployment drawings.
  (Excalidraw considered for quick threat-model sketches — optional later; draw.io
  also covers threat-model diagrams via its threat-modeling shapes.)
- **Diagram storage**: new Supabase bucket + `product_diagrams` table (type:
  architecture | data_flow | environment | threat_model | hardware_layout),
  versioned, referenced by the technical file.
- **Evidence/test-report storage**: reuse the proven conformity-attachment pattern
  (bucket + size/MIME allowlist) for `product_evidence` (test reports, due-diligence).
- **SBOM**: already covered; add an SBOM "current/version" pointer into the tech file.
- **Technical-file assembly**: a server-side compiler that gathers all Annex VII
  pieces (descriptions, diagrams, SBOM, CVD, risk assessment, standards, test
  reports, DoC) into one ordered PDF bundle.

---

## D. Phased implementation plan

Each phase is independently shippable to staging, CI-gated, no production
promotion without your go-ahead. Phases ordered by compliance impact + dependency.

### Phase 1 — Diagramming (draw.io) + evidence vault  ★ the headline gap
- Embed draw.io editor (`react-drawio`) in a new product "Diagrams" area.
- `product_diagrams` table + storage bucket (PNG+XML), types: architecture /
  data-flow / environment / threat-model / hardware-layout; versioned; per-org RLS.
- "Evidence" vault: upload test reports, due-diligence records, misc evidence
  (reuse conformity-attachment storage pattern), tagged to Annex VII point.
- Wire diagrams + evidence into the product's Technical Documentation.
- **Covers:** Annex VII 2(a) drawings/architecture, 1.3 hardware illustrations,
  6 test reports; threat-model (recommended); Art 13(5) due-diligence.

### Phase 2 — Risk assessment, done properly (Art 13 + Annex VII 3)
- Rebuild the Risk Assessment as a structured, versioned artifact: intended
  purpose, operational environment, assets, use duration; per-Annex-I-item
  applicability mapping (applies / how-implemented / **N/A + justification**),
  pulling from the existing `cra-requirements.ts` + conformity checklist.
- Dated versions (update history) per Art 13(3),(7).
- **Covers:** Art 13(2)–(4), Annex VII 3, Art 13(4) inapplicability justifications.

### Phase 3 — Annex VII technical-file assembler + retention
- Server-side compiler that assembles the full ordered Annex VII package (all 8
  points) into one branded PDF + a manifest checklist showing what's present/missing.
- Retention model: lock a "released" technical file version + DoC with a 10-year
  retention marker (Art 13(13)); surfaced, not auto-deletable.
- **Covers:** Annex VII assembly, Art 13(13) retention/archival.

### Phase 4 — Article 14 incident & vulnerability reporting workflow
- Deadline-driven workflow with a visible clock: early warning (24h), notification
  (72h), final report (14d) for severe incidents; + actively-exploited-vuln track;
  1-month final report. Templates per stage (both triggers), submission log with
  timestamps, ENISA Single Reporting Platform packaging/export, user-notification
  step. Builds on the existing incident register + reporting deadline UI.
- **Covers:** Art 14 fully (live from 11 Sep 2026).

### Phase 5 — DoC/CE completeness + Annex II + product identity
- Verify/complete EU DoC to all 8 Annex V fields; add **simplified DoC** (Annex VI)
  with hosted URL; CE-marking guidance + affixing record (Art 30).
- Complete Annex II user-information generator (items 1–9 incl. 8a–8f), support-
  period end-date as a buyer-facing artifact (Art 13(19)).
- Product identification fields: type/batch/serial + manufacturer contact labelling
  (Art 13(15),(16)).
- **Covers:** DoC/CE, Annex II, product identity gaps.

### Phase 6 — Lifecycle & supply-chain records
- Conformity route → module record tracking (A / B+C / H) + notified-body details
  & certificate storage (Art 32, Annex VIII).
- Supply-chain register: upstream/downstream operators, 10-yr (Art 23).
- Post-market monitoring register + per-fix vulnerability advisories (Annex I II.4);
  recurring security-test schedule/log (Annex I II.3); end-of-support notification
  + corrective-action/recall procedure (Art 13(19),(21)).
- **Covers:** the remaining ongoing/supply-chain/lifecycle artifacts.

### Cross-cutting (every phase)
- All UI in EN/DE/FR/IT (matches the existing i18n system) and design-token compliant.
- Copilot + Academy references updated to point at the new tools.
- A per-product **"CRA readiness" dashboard**: the master artifact checklist with
  have/partial/missing status — the single pane that proves completeness.

---

## E. Open questions for you
1. **Diagram tool**: confirm **draw.io** as the primary (my recommendation), or do
   you also want Excalidraw for lightweight sketching?
2. **Scope/order**: build all 6 phases, or start with Phase 1 (diagrams+evidence)
   and Phase 2 (risk assessment) — the two highest-impact gaps — then reassess?
3. **Phase 4 ENISA reporting**: build the full deadline workflow now (obligation
   starts 11 Sep 2026), or after the documentation phases?
4. The **CRA readiness dashboard** (cross-cutting): build it early (Phase 1) as the
   spine, or last as the capstone?
