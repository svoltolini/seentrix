# Seentrix — product overview for Copilot

Ground-truth description of what the Seentrix platform actually does,
organised the way users ask about it. The Copilot cites this to answer
"how do I do X in Seentrix" questions.

The rule: if something is not written here, it is not a Seentrix feature.
Do not invent capabilities that feel plausible but are absent from this
document.

---

## Products

A Product in Seentrix represents one product with digital elements
placed on the EU market. Each Product has these structured fields:

- `name` — human-readable product name.
- `type` — one of `hardware`, `software`, `firmware`, `iot`.
- `cra_category` — one of `default`, `important_class_i`,
  `important_class_ii`, `critical`. Drives which conformity route
  applies.
- `conformity_route` — one of `module_a` (self-assessment),
  `module_b_c` (type examination + production QA), `module_h` (full
  quality assurance), or `european_certification`.
- `target_market` — free-text description of the intended market.
- `connectivity` / `data_processing` / `intended_use` — descriptive
  fields used in the technical documentation and DoC.
- `requires_notified_body` — boolean. When true, the DoC generator
  prompts for `notified_body_name`, `notified_body_id`, and
  `notified_body_scope`.
- `declaration_version` + `declaration_issued_at` — tracked once a
  Declaration of Conformity has been issued for this product.

Products are managed in the "Products" screen. The product detail
page has tabs for SBOM, vulnerabilities, technical documentation, the
Declaration of Conformity, Academy training progress for the team,
and the activity log.

Product conformity progress is tracked in a separate
`product_conformity_steps` table — each step has its own status
(`pending`, `in_progress`, `complete`, `not_applicable`). There is
**no single "compliance status" enum** on the product itself; progress
is the sum of those step statuses.

## SBOM

Seentrix **manages and analyses** Software Bills of Materials — it
does **not generate** them. The user produces an SBOM externally and
uploads the file on the product's SBOM tab. Seentrix then:

1. Parses the file (CycloneDX JSON or XML, or SPDX JSON — max 50 MB).
2. Stores every component (name, version, licence, supplier).
3. Queries OSV.dev for known vulnerabilities affecting each component.
4. Enriches each vulnerability with full detail from OSV's
   `/v1/vulns/{id}` endpoint.
5. Maps CVSS scores to severity: `>= 9.0` → critical, `>= 7.0` → high,
   `>= 4.0` → medium, `< 4.0` → low.

Accepted formats: **CycloneDX 1.5 / 1.6** (JSON or XML) and **SPDX
2.3** (JSON). No other formats are supported.

## Generating an SBOM (external, not inside Seentrix)

Manufacturers produce the SBOM file with one of these free tools,
then drag-and-drop the resulting JSON/XML into Seentrix:

- **Syft** (Anchore) — `syft scan dir:. -o cyclonedx-json=sbom.json`.
  Works on filesystems, container images, and archives.
- **Trivy** (Aqua Security) — `trivy fs --format cyclonedx --output sbom.json .`.
  Also does vulnerability scanning in the same pass.
- **cdxgen** (OWASP) — multi-language, produces CycloneDX directly.
- **GitHub dependency-graph export** — `gh sbom` if the repo is hosted
  on GitHub.
- **Your CI pipeline** — most vendors (GitLab, Jenkins, CircleCI) have
  first-class SBOM steps that emit CycloneDX artefacts.

Seentrix does not ship an SBOM generator, does not scan source code,
and does not inspect binaries. The manufacturer keeps the tooling
that knows their build; Seentrix picks up the conversation once the
SBOM file exists.

## Vulnerabilities

Vulnerabilities discovered from an uploaded SBOM land in the
product's Vulnerabilities tab and in the org-wide Vulnerability
Reports screen. Each vulnerability has:

- CVE or GHSA identifier + summary from OSV.
- Affected component + version.
- Fix version (if OSV knows one).
- Severity (`critical`, `high`, `medium`, `low`).
- Status: **`open`**, **`in_progress`**, **`resolved`**, or
  **`accepted`**. (Not "Fixed" / "Won't Fix" — those names are not
  used in Seentrix.)

External advisory links resolve based on identifier shape: CVE →
NIST NVD, GHSA → GitHub advisories, anything else → osv.dev.

Private researcher reports are collected through the org's public
PSIRT page (see next section).

## Public PSIRT / coordinated vulnerability disclosure

If an admin flips `security_public_enabled = true` on the
organisation, Seentrix exposes a **public intake page** at
`/security/<org-slug>` where outside researchers can submit
vulnerability reports. The form collects: title, description,
affected product, severity (critical/high/medium/low), and optional
reporter contact details (`reporter_name`, `reporter_email`,
`reporter_handle`).

Submissions land in the org's Vulnerability Reports screen as
authenticated rows.

**What does not exist:** Seentrix does not serve a `/security.txt` or
`.well-known/security.txt` file. The intake is HTML-only.

## Declaration of Conformity (DoC)

The Documents tab of each Product has the DoC generator. The user
fills a structured form (manufacturer details, product identity,
harmonised standards applied, notified body info if required) and
Seentrix produces a CE-ready PDF aligned with CRA Annex IV. Every
DoC has a `declaration_version` and `declaration_issued_at` — both
live on the Products table.

**CRA retention rule (informational, not app-enforced):** Under
Article 13(20), the manufacturer must keep the DoC and technical
documentation for 10 years after the last unit of the product was
placed on the EU market. Seentrix stores these indefinitely at the
data layer; plan-based retention limits apply to other artefacts
(see activity log section). The 10-year clock is the manufacturer's
obligation, not a Seentrix feature.

## Technical documentation

The Documents tab also produces a technical documentation PDF
aligned with CRA Annex VII, built from the same product fields.

## Incident reporting

The Incidents screen implements the Article 14 workflow. Each
incident has:

- `type`: `security_incident` or `exploited_vulnerability`.
- `severity`: `critical`, `high`, `medium`, `low`.
- `status`: one of `detected`, `early_warning_submitted`,
  `incident_report_submitted`, `final_report_submitted`, `closed`.

Three submission phases each get their own timestamp + notes fields
(`early_warning_submitted_at` + `early_warning_notes`, then
`incident_report_*`, then `final_report_*`). A fourth set
(`user_notification_sent_at` + `user_notification_content`) supports
the Article 14(3) obligation to inform affected users.

**CRA deadlines (informational):** 24 hours for the early warning,
72 hours for the intermediate report, 14 days for the final
vulnerability report (or one month for the final incident report).
These deadlines are the manufacturer's obligation; Seentrix records
timestamps but does not hard-block submission after a window
elapses.

## Academy

In-app training to satisfy the CRA "cybersecurity awareness"
expectation for staff involved in product development. Lessons:

- `cra-101` — Scope and timeline
- `annex-i-essential-requirements`
- `declaration-of-conformity`
- `conformity-assessment-routes`
- `economic-operator-roles`
- `support-period-obligations`
- `article-14-reporting`
- `vulnerability-handling-101`
- `scoring-vulnerabilities`
- `sbom-fundamentals`
- `cvd-and-psirt`

Each lesson is a ~5-minute read plus a **5-question multiple-choice
quiz**. The quiz pass threshold is **4 out of 5** (80%). Completion
is tracked per user in `academy_completions`; attempts in
`academy_quiz_attempts`.

Lessons are assigned per role (the lesson registry in
`src/lib/academy/lessons.ts` declares `requiredForRoles`). On
passing a lesson the user can download a PDF certificate.

## Roles

The database role column on users accepts exactly these values:
**`admin`**, **`compliance_officer`**, **`cto`**, **`editor`**,
**`viewer`**. Row-level security policies enforce access by role;
there is no separate role-to-feature permission matrix UI.

Rough responsibilities (from how the app and Academy lessons
describe them):

- **admin** — billing, organisation settings, danger-zone actions,
  GDPR export and deletion request.
- **compliance_officer** — Declarations of Conformity, technical
  documentation, incident reports.
- **cto** — SBOM uploads, vulnerability triage, product security
  configuration.
- **editor** — read/write access to everything except billing and
  org-level destructive actions.
- **viewer** — read-only.

## Team management

- Admins invite colleagues by email from Settings → Team. Invites
  live in an `invites` table; accepting one provisions the user
  into the same org.
- A user belongs to exactly one organisation. Seentrix does **not**
  support multi-org switching within a single account; there is no
  "switch organisation" menu.
- Admins can revoke invites and remove team members.

## Organisation deletion (GDPR Art. 17 / right to erasure)

Under Settings → Organization → Danger Zone, an admin can request
deletion of the entire organisation. This marks
`deletion_requested_at` and `deletion_requested_by`, starts a
**30-day grace period** during which the org keeps working, and
allows any admin to cancel the request during that window. The
scheduled hard-delete job that runs at day 30 is pending
implementation; at present the grace window is enforced but the
actual row removal is manual.

There is no individual-user "delete my account" flow independent of
the organisation — the user can leave a team, but the org itself is
the unit of deletion.

## Data export (GDPR Art. 20 / data portability)

An admin can export every row the organisation owns as a single JSON
bundle from Settings → Account. The export includes: users, products,
documents, activities, incidents, academy completions, vulnerability
reports, and related metadata. Binary blobs (SBOM files, avatars)
are referenced by storage URL but not embedded.

Non-admins cannot self-serve an export.

## Billing

Stripe powers subscriptions. Admins manage everything from Settings →
Billing, which links into the Stripe customer portal (change card,
cancel, download invoices).

Plan tiers (EUR, monthly):

| Plan         | Price | Products | Users | Activity retention | Monitoring |
|--------------|------:|---------:|------:|--------------------|------------|
| Free         |    €0 |        1 |     1 | 30 days            | On-demand  |
| Professional |   €59 |        3 |     3 | 90 days            | Weekly     |
| Business     |  €199 |       15 |    10 | Unlimited          | Daily      |
| Enterprise   |  €749 | Unlimited | Unlimited | Unlimited       | Real-time  |

Annual plans are 2 months free (`€590 / €1,990 / €7,490` on the
paid tiers).

Feature gates by plan:

- **Professional+** unlocks SBOM uploads, document PDFs (DoC +
  technical documentation + end-user info sheet).
- **Business+** unlocks the public PSIRT intake and the Seentrix API.
- **Enterprise** unlocks SSO, custom branding, and parent/child
  organisations.

Seentrix does **not** currently offer a free trial on Pro/Business/
Enterprise — the free tier is the free trial.

## Activity log

Every significant action writes to the `activities` table with:
action key (e.g. `sbom.uploaded`, `gdpr.export_generated`,
`gdpr.deletion_requested`), target type, target id, target name,
and optional metadata. Admins view the org-wide log from Settings →
Activity.

Retention per plan: **Free 30 days, Professional 90 days, Business
and Enterprise unlimited** (no hardcoded ten-year floor —
manufacturers on Free/Pro who need Article 13 evidence beyond the
plan's retention window must export and store it themselves).

## Where your data lives

- Database + authentication + file storage: **Supabase** in
  `eu-west-2` (London).
- Web application: **Vercel** in `fra1` (Frankfurt).
- Error monitoring: **Sentry** at `de.sentry.io` (Germany), PII
  disabled, session replays masked.
- Copilot (AI): **Mistral AI** (Paris, France).
- Payments: **Stripe Payments Europe Ltd.** (Ireland), card data
  tokenised.
- Transactional email: **Resend** (US infrastructure — documented
  in the DPA).

Full detail lives in the Privacy Policy at `/legal/privacy` and the
DPA at `/legal/dpa`.

## Integrations

Seentrix has these integrations today:

- **Stripe** — subscriptions + billing portal.
- **OSV.dev** — vulnerability enrichment.
- **NIST NVD** and **GitHub advisories** — external-link targets only
  (no API pulls).

Seentrix does **not** currently integrate with:

- Jira / ServiceNow / Linear or any issue tracker.
- GitHub / GitLab / Bitbucket as source repositories.
- Jenkins / GitHub Actions / GitLab CI / CircleCI or any other CI
  system.
- Slack / Teams / Discord notifications.
- SSO identity providers (Okta, Azure AD, Google Workspace) — planned
  for Enterprise but not shipped.
- SCIM user provisioning.

If someone asks about one of the integrations above, say the feature
is not available today and recommend they export the artefact from
Seentrix manually and paste it into the other system.

## What Seentrix does NOT do

Explicit anti-hallucination list — a shortcut to stop the Copilot
inventing plausible-sounding features that do not exist:

- **No SBOM generator** — Seentrix only ingests SBOMs produced
  elsewhere.
- **No source-code scanner or SAST.**
- **No binary analysis / reverse engineering / licence scanning
  beyond what the uploaded SBOM declares.**
- **No `/security.txt`** — the public PSIRT page is HTML at
  `/security/<org-slug>`.
- **No "Fixed" or "Won't Fix" vulnerability statuses** — use
  `resolved` or `accepted`.
- **No product-level "owner" field.**
- **No single product "compliance status" enum** — progress is
  tracked via per-step statuses.
- **No multi-organisation switching** — one user belongs to one org.
- **No individual user "delete my account"** — deletion is at the org
  level.
- **No incident deadline auto-blocker** — timestamps are recorded,
  enforcement is the manufacturer's.
- **No scheduled hard-delete job yet** — the 30-day grace is
  implemented, the final purge is manual until a scheduled job ships.
- **No free trial of paid plans** — the Free tier is the free trial.
- **No GBP / USD pricing** — EUR only.
- **No Jira / GitHub / Jenkins / Slack / Okta / SCIM integrations.**
- **No tenant-owned AI model** — the Copilot uses our Mistral account;
  customers cannot swap it for their own key or their own model.
