# Seentrix — product overview for Copilot

How the Seentrix platform maps to CRA obligations. The Copilot uses
this to answer "how do I do X in Seentrix" style questions.

---

## Products

A Product in Seentrix represents one product with digital elements
placed on the EU market. Each Product has:

- A unique identifier.
- A type (hardware, software, IoT, embedded firmware, cloud service).
- A support period (Article 13(8)) — at least five years.
- An owner (compliance officer).
- An update channel (how security updates reach end users).
- A compliance status (Not Ready / In Progress / Ready to Issue / Issued).

Users create Products on the "Products" screen. The product detail
page groups the SBOM, vulnerabilities, Declaration of Conformity,
Academy training progress, and activity log.

---

## SBOM

The Software Bill of Materials is a CycloneDX 1.6 JSON file the user
uploads on the product's SBOM tab. Seentrix then:

1. Parses every component and stores its name, version, and licence.
2. Queries OSV.dev for known vulnerabilities affecting each component.
3. Enriches each vulnerability with full CVE detail from `/v1/vulns/{id}`.
4. Maps CVSS scores to severity (critical / high / medium / low).

SBOM freshness is tracked — an SBOM older than 30 days is flagged.

---

## Vulnerabilities

The Vulnerability Reports screen lists every CVE discovered from
uploaded SBOMs. Each row shows:

- Severity (critical / high / medium / low).
- CVE id and summary.
- Affected component and version.
- Fix version if available.
- Status (Open / In Progress / Fixed / Won't Fix).

Users can also submit a private report via the organisation's public
PSIRT page at `/security/<org-slug>` — this page is auto-generated to
satisfy CRA Article 13(2) "single point of contact" + Annex II(2).

---

## Declaration of Conformity (DoC)

The Documents tab of each Product contains the DoC generator. The
user fills a structured form (manufacturer details, product identity,
standards applied, notified body if any) and Seentrix produces a
CE-ready PDF aligned with Annex IV. Every DoC has a version number
and issue date.

DoCs are retained for ten years after the product's support period
ends — the CRA Article 13(20) retention requirement.

---

## Incident reporting

The Incidents screen implements the Article 14 workflow:

- **24-hour early warning** — quick form, submitted to the CSIRT.
- **72-hour report** — expanded detail, assessment, mitigations.
- **14-day final report** — root cause, impact, remediation.
- **User notification composer** — templated email to affected users.

Each incident has a countdown ring showing time remaining in the
current reporting window.

---

## Academy

In-app training courses that satisfy the CRA "demonstrable
cybersecurity awareness" expectation for staff involved in product
development. Lessons are assigned by role (admin, compliance officer,
CTO, editor, viewer). A lesson comprises a 5-minute read plus a
5-question quiz requiring 4/5 correct to pass.

Completion progress is tracked at the Organisation level and shown
on the dashboard Training tile.

---

## Activity log

Every significant action (SBOM upload, DoC issued, incident report
submitted, training completed) is written to an immutable activity
log. Retention is ten years to satisfy CRA Article 13 evidence
requirements. The log is surfaced on the Dashboard and in each
product's detail page.

---

## Roles and permissions

- **Admin** — billing, sub-processors, organisation settings.
- **Compliance officer** — DoCs, technical documentation, incidents.
- **CTO** — SBOM, vulnerabilities, product security configuration.
- **Editor** — everything except billing and organisation settings.
- **Viewer** — read-only.

Seentrix enforces this via row-level security in Postgres, not just
the UI — a user without a role simply cannot read the data.

---

## Where your data lives

- Database + authentication: Supabase in `eu-west-2` (London).
- Web application: Vercel in `fra1` (Frankfurt).
- Error monitoring: Sentry at `de.sentry.io` (Germany), PII disabled,
  session replays masked.
- AI copilot: Mistral AI (Paris, France).
- Payments: Stripe Payments Europe Ltd. (Ireland), card data tokenised.
- Transactional email: Resend.

All customer data is kept in the EU. Full detail is in the Privacy
Policy at `/legal/privacy` and the DPA at `/legal/dpa`.
