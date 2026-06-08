import { tool } from "ai";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { CRA_REQUIREMENTS } from "@/lib/constants/cra-requirements";

/**
 * Agentic lookup tools — Phase 2 Pillar 3.
 *
 * Every tool runs through the user's authenticated Supabase client, so
 * RLS enforces org + user scoping for free. None of them mutate; the
 * worst they can do is show the user a link or surface data they
 * already have permission to read.
 *
 * Tools are invoked by Mistral Large via the AI SDK's function-calling
 * contract. Their return values become UIMessage tool-result parts,
 * which the client renders either as prose (the model re-incorporates
 * them) or as a structured button (the `linkToPage` case).
 */

type SB = Awaited<ReturnType<typeof createClient>>;

interface Ctx {
  supabase: SB;
  orgId: string;
  plan: string;
}

export function buildCopilotTools({ supabase, orgId, plan }: Ctx) {
  const isPaid = plan !== "free";
  return {
    // -------------------------------------------------------------------
    // searchProducts — "my router product" → [{id, name, type}]
    // -------------------------------------------------------------------
    searchProducts: tool({
      description:
        "Find products in the user's organisation by a fuzzy name match. Returns up to 10 products with id, name, type, and CRA category. Call this first whenever the user mentions a product by a partial name.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("A substring of the product name (case-insensitive)."),
      }),
      execute: async ({ query }) => {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, type, cra_category")
          .eq("org_id", orgId)
          .ilike("name", `%${query}%`)
          .order("updated_at", { ascending: false })
          .limit(10);
        if (error) return { error: error.message };
        return { products: data ?? [] };
      },
    }),

    // -------------------------------------------------------------------
    // getProductStatus — compliance snapshot for one product.
    // -------------------------------------------------------------------
    getProductStatus: tool({
      description:
        "Return a compliance status snapshot for a single product — SBOM freshness + component count, vulnerability totals from the active SBOM, open vulnerabilities by severity, Declaration of Conformity version + issue date, support period, and conformity-assessment step progress. Use this when the user asks 'what's my status?', 'am I ready to ship?', or similar.",
      inputSchema: z.object({
        productId: z
          .string()
          .uuid()
          .describe("Product id (UUID) returned by searchProducts."),
      }),
      execute: async ({ productId }) => {
        const [
          { data: product },
          { data: sbomRows },
          { data: openVulns },
          { data: stepRows },
        ] = await Promise.all([
          supabase
            .from("products")
            .select(
              "name, type, cra_category, conformity_route, declaration_version, declaration_issued_at, support_period_start, support_period_end",
            )
            .eq("id", productId)
            .eq("org_id", orgId)
            .maybeSingle(),
          supabase
            .from("sboms")
            .select(
              "created_at, last_scanned_at, sbom_format, total_components, critical_count, high_count, medium_count, low_count, kev_count",
            )
            .eq("product_id", productId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("vulnerabilities")
            .select(
              "severity, sbom_components!inner(sboms!inner(product_id))",
            )
            .eq("sbom_components.sboms.product_id", productId)
            .in("status", ["open", "in_progress"]),
          supabase
            .from("product_conformity_steps")
            .select("step_key, status")
            .eq("product_id", productId),
        ]);
        if (!product) return { error: "product_not_found" };

        const sbom = (sbomRows as unknown[] | null)?.[0] ?? null;
        const openRows = (openVulns as { severity: string }[] | null) ?? [];
        const openBySev = openRows.reduce<Record<string, number>>(
          (acc, v) => {
            acc[v.severity] = (acc[v.severity] ?? 0) + 1;
            return acc;
          },
          {},
        );
        const steps =
          (stepRows as { step_key: string; status: string }[] | null) ?? [];
        const stepsCompleted = steps.filter(
          (s) => s.status === "complete",
        ).length;
        const stepsApplicable = steps.filter(
          (s) => s.status !== "not_applicable",
        ).length;

        return {
          product,
          sbom,
          openVulns: {
            critical: openBySev.critical ?? 0,
            high: openBySev.high ?? 0,
            medium: openBySev.medium ?? 0,
            low: openBySev.low ?? 0,
            total: openRows.length,
          },
          conformityProgress: {
            completed: stepsCompleted,
            applicable: stepsApplicable,
            steps,
          },
        };
      },
    }),

    // -------------------------------------------------------------------
    // listOverdueItems — everything the org should have done but hasn't
    // -------------------------------------------------------------------
    listOverdueItems: tool({
      description:
        "List the org-wide items that need the user's attention: products without an SBOM, products whose SBOM is older than 30 days, products without a Declaration of Conformity, and open critical / high vulnerabilities. Use this when the user asks 'what's overdue?', 'what should I do today?', or similar.",
      inputSchema: z.object({}),
      execute: async () => {
        const thirtyDaysAgoIso = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();

        // Products + their active SBOM in one round-trip via a nested
        // select; we count what's missing / stale in memory rather than
        // running three separate queries.
        const { data: products, error } = await supabase
          .from("products")
          .select(
            "id, name, declaration_version, sboms(id, created_at, is_active, critical_count, high_count)",
          )
          .eq("org_id", orgId);
        if (error) return { error: error.message };

        const rows = (
          (products as
            | {
                id: string;
                name: string;
                declaration_version: string | null;
                sboms: {
                  id: string;
                  created_at: string;
                  is_active: boolean;
                  critical_count: number | null;
                  high_count: number | null;
                }[];
              }[]
            | null) ?? []
        ).map((p) => {
          const active = p.sboms.find((s) => s.is_active);
          const sbomAgeDays = active
            ? Math.floor(
                (Date.now() - new Date(active.created_at).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;
          return {
            id: p.id,
            name: p.name,
            missingSbom: !active,
            sbomStale:
              !!active && active.created_at < thirtyDaysAgoIso,
            sbomAgeDays,
            missingDoc: !p.declaration_version,
            criticalOnSbom: active?.critical_count ?? 0,
            highOnSbom: active?.high_count ?? 0,
          };
        });

        return {
          missingSbom: rows.filter((r) => r.missingSbom),
          staleSbom: rows.filter((r) => r.sbomStale),
          missingDoc: rows.filter((r) => r.missingDoc),
          highRiskProducts: rows.filter(
            (r) => r.criticalOnSbom > 0 || r.highOnSbom > 0,
          ),
        };
      },
    }),

    // -------------------------------------------------------------------
    // getRiskAssessmentStatus — Annex I mapping coverage for one product.
    // -------------------------------------------------------------------
    getRiskAssessmentStatus: tool({
      description:
        "Report the CRA risk-assessment status for a single product: whether an assessment exists, its version + draft/released state, and how many of the 21 Annex I requirements are still unmapped, how many apply, how many are marked not-applicable, and how many are missing the required implementation or justification text. Use this when the user asks 'is my risk assessment done?', 'which Annex I items are still unmapped?', or 'what's left on the risk assessment for <product>?'.",
      inputSchema: z.object({
        productId: z
          .string()
          .uuid()
          .describe("Product id (UUID) returned by searchProducts."),
      }),
      execute: async ({ productId }) => {
        const { data: rows } = await supabase
          .from("risk_assessments")
          .select("id, status, version, released_at")
          .eq("product_id", productId)
          .eq("org_id", orgId)
          .order("version", { ascending: false });
        const all =
          (rows as {
            id: string;
            status: string;
            version: number;
            released_at: string | null;
          }[] | null) ?? [];
        if (all.length === 0) {
          return { exists: false, totalRequirements: CRA_REQUIREMENTS.length };
        }
        const current = all.find((r) => r.status === "draft") ?? all[0];
        const { data: itemRows } = await supabase
          .from("risk_assessment_items")
          .select("requirement_id, applicability, implementation, justification")
          .eq("risk_assessment_id", current.id);
        const byId = new Map(
          ((itemRows as {
            requirement_id: string;
            applicability: string | null;
            implementation: string | null;
            justification: string | null;
          }[] | null) ?? []).map((i) => [i.requirement_id, i]),
        );

        let applies = 0;
        let notApplicable = 0;
        const unmapped: string[] = [];
        let missingImplementation = 0;
        let missingJustification = 0;
        for (const req of CRA_REQUIREMENTS) {
          const it = byId.get(req.id);
          if (!it || !it.applicability) {
            unmapped.push(req.id);
            continue;
          }
          if (it.applicability === "applies") {
            applies++;
            if (!it.implementation?.trim()) missingImplementation++;
          } else {
            notApplicable++;
            if (!it.justification?.trim()) missingJustification++;
          }
        }

        return {
          exists: true,
          status: current.status,
          version: current.version,
          releasedAt: current.released_at,
          totalRequirements: CRA_REQUIREMENTS.length,
          applies,
          notApplicable,
          unmappedCount: unmapped.length,
          unmapped,
          missingImplementation,
          missingJustification,
        };
      },
    }),

    // -------------------------------------------------------------------
    // findCve — pull a CVE / GHSA record directly from OSV.
    // -------------------------------------------------------------------
    findCve: tool({
      description:
        "Look up a specific CVE or GHSA vulnerability from OSV.dev and return its summary, severity, affected packages, and fixed versions. Use this when the user mentions a CVE id (e.g. CVE-2021-44228) and wants context.",
      inputSchema: z.object({
        id: z
          .string()
          .regex(/^(CVE-|GHSA-)/i)
          .describe(
            "A CVE id (e.g. CVE-2021-44228) or GHSA id (e.g. GHSA-jfh8-c2jp-5v3q).",
          ),
      }),
      execute: async ({ id }) => {
        try {
          const res = await fetch(
            `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`,
            { headers: { accept: "application/json" } },
          );
          if (!res.ok) {
            return { error: `osv_${res.status}` };
          }
          const body = (await res.json()) as {
            summary?: string;
            details?: string;
            severity?: { type: string; score: string }[];
            affected?: {
              package?: { name?: string; ecosystem?: string };
              ranges?: unknown[];
            }[];
            references?: { type: string; url: string }[];
          };
          return {
            id,
            summary: body.summary ?? "",
            details: body.details?.slice(0, 1000) ?? "",
            severity: body.severity ?? [],
            affectedPackages:
              body.affected?.slice(0, 10).map((a) => ({
                name: a.package?.name,
                ecosystem: a.package?.ecosystem,
              })) ?? [],
            references: (body.references ?? [])
              .filter((r) => r.type === "ADVISORY" || r.type === "FIX")
              .slice(0, 5),
          };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    }),

    // NOTE: linkToPage was removed from the tool palette. Chaining one
    // `linkToPage` call per onboarding step added two or three extra
    // LLM turns per answer, and Mistral kept hitting an internal
    // output-token ceiling on long streams with many tool-calls —
    // the answer would stop mid-workflow right before the next call.
    // The model now writes a plain markdown link on its own line
    // (`[Upload SBOM](/app/products)`) and the renderer promotes any
    // such bare-link line into the same big blue button. No tool
    // call, no extra step, no truncation.

    // -------------------------------------------------------------------
    // explainTerm — glossary lookup for CRA jargon.
    // -------------------------------------------------------------------
    explainTerm: tool({
      description:
        "Look up a compliance / CRA term in Seentrix's in-app glossary and return its definition plus links to related lessons if available. Use this when the user asks 'what is X?' about a term that would be in the glossary (e.g. 'SBOM', 'CE marking', 'notified body').",
      inputSchema: z.object({
        term: z
          .string()
          .min(1)
          .describe(
            "The term or concept the user is asking about (case-insensitive).",
          ),
      }),
      execute: async ({ term }) => {
        // The glossary ships as a next-intl JSON bundle — import the
        // en namespace at runtime and run a simple substring match.
        // We skip the _meta key and rely on the rest being term rows.
        const en = (
          await import("../../../messages/en/glossary.json")
        ).default.glossary as Record<
          string,
          | {
              title?: string;
              body?: string;
              ref?: string;
            }
          | { _meta: unknown }
        >;
        const needle = term.toLowerCase();
        const entries = Object.entries(en).filter(
          ([key]) => key !== "_meta",
        ) as [
          string,
          { title?: string; body?: string; ref?: string },
        ][];
        const match = entries.find(([id, entry]) => {
          const title = entry.title?.toLowerCase() ?? "";
          return (
            title === needle ||
            title.includes(needle) ||
            id.toLowerCase().includes(needle.replace(/\s+/g, "_"))
          );
        });
        if (!match) return { found: false, term };
        const [id, entry] = match;
        const { GLOSSARY_LESSONS } = await import("@/lib/glossary");
        return {
          found: true,
          id,
          title: entry.title,
          body: entry.body,
          reference: entry.ref,
          relatedLesson:
            (GLOSSARY_LESSONS as Record<string, string | undefined>)[id] ??
            null,
        };
      },
    }),

    // ===================================================================
    // Draft tools — paid-tier only. Each one returns a structured
    // markdown draft the model hands to the user for review. Never
    // mutates a DB row; never bypasses the existing signed-document
    // flow (DoC generator, incident form, etc.). Every draft carries
    // a "Review before use — not legal advice" footer.
    // ===================================================================

    ...(isPaid
      ? {
          // ----------------------------------------------------------
          // draftDeclarationOfConformity
          // ----------------------------------------------------------
          draftDeclarationOfConformity: tool({
            description:
              "Produce a Declaration of Conformity (CRA Annex IV) draft for one of the user's products, pre-filled with manufacturer details, product identification, the notified body info if the product needs one, and placeholders for harmonised standards that the user must confirm. Output is markdown the user reviews; it does NOT issue a DoC. For the real signed document, the user still uses the Documents tab in the product page.",
            inputSchema: z.object({
              productId: z
                .string()
                .uuid()
                .describe("Product id from searchProducts."),
            }),
            execute: async ({ productId }) => {
              const [{ data: product }, { data: org }] = await Promise.all([
                supabase
                  .from("products")
                  .select(
                    "name, type, cra_category, conformity_route, intended_use, connectivity, requires_notified_body, notified_body_name, notified_body_id, notified_body_scope, declaration_version, declaration_issued_at",
                  )
                  .eq("id", productId)
                  .eq("org_id", orgId)
                  .maybeSingle(),
                supabase
                  .from("organizations")
                  .select(
                    "legal_name, name, registration_number, address_line1, address_line2, postal_code, city, country, website, signatory_name, signatory_position",
                  )
                  .eq("id", orgId)
                  .maybeSingle(),
              ]);
              if (!product) return { error: "product_not_found" };
              if (!org) return { error: "org_not_found" };

              const p = product as Record<string, string | boolean | null>;
              const o = org as Record<string, string | null>;
              const placeholders: string[] = [];
              const warnings: string[] = [];

              const manufacturerName =
                (o.legal_name || o.name) ?? "[Manufacturer legal name]";
              if (!o.legal_name) {
                placeholders.push("manufacturer legal name");
                warnings.push(
                  "Organisation legal name is not set — update Settings → Entity.",
                );
              }
              const addressLines = [
                o.address_line1,
                o.address_line2,
                [o.postal_code, o.city].filter(Boolean).join(" "),
                o.country,
              ].filter(Boolean);
              if (addressLines.length === 0) {
                placeholders.push("manufacturer address");
                warnings.push(
                  "Registered address is blank — fill it in on Settings → Entity before issuing.",
                );
              }

              const needsNB = p.requires_notified_body === true;
              const nbBlock = needsNB
                ? `| Notified body | ${p.notified_body_name || "[name]"} |
| Notified body ID | ${p.notified_body_id || "[four-digit number]"} |
| Scope | ${p.notified_body_scope || "[scope of the certificate]"} |`
                : "> This product's CRA category does not require a notified body (module A self-assessment).";

              const version = (p.declaration_version as string) || "1";
              const today = new Date().toISOString().slice(0, 10);

              const draft = `# Declaration of Conformity (draft) — v${version}

**${manufacturerName}**
${addressLines.join(", ") || "[address]"}
${o.registration_number ? `Companies register no. ${o.registration_number}` : "[registration number]"}
${o.website ? `${o.website}` : ""}

This Declaration of Conformity is issued under the sole responsibility of the manufacturer.

## Object of the declaration

| Field | Value |
|---|---|
| Product | ${p.name ?? "[product name]"} |
| Type | ${p.type ?? "[product type]"} |
| CRA category | ${(p.cra_category as string) ?? "default"} |
| Conformity-assessment route | ${(p.conformity_route as string) ?? "[module a / b+c / h / european certification]"} |
| Intended use | ${p.intended_use ?? "[intended use]"} |
| Connectivity | ${p.connectivity ?? "[connectivity summary]"} |

## Statement of conformity

The object described above is in conformity with Regulation (EU) 2024/2847 (the Cyber Resilience Act) and the other Union harmonisation legislation applicable to this product.

## Harmonised standards applied

> Replace this block with the specific standards you relied on. Common ones for products with digital elements include:
> - EN 18031-1 (common cybersecurity requirements — radio equipment)
> - ETSI EN 303 645 (consumer IoT baseline)
> - IEC 62443-4-2 (industrial automation)
>
> If you applied a technical specification instead of a harmonised standard, note the reference.

${nbBlock}

## Signed

| | |
|---|---|
| Place | ${o.city || "[city]"} |
| Date | ${today} |
| For and on behalf of | ${manufacturerName} |
| Name | ${o.signatory_name || "[full name]"} |
| Position | ${o.signatory_position || "[role]"} |
| Signature | _________________________ |

---
*Review before use — not legal advice. The binding DoC is generated from the Documents tab on the product page; this markdown is a working draft.*`;

              return { draft, placeholders, warnings };
            },
          }),

          // ----------------------------------------------------------
          // draftIncidentNarrative
          // ----------------------------------------------------------
          draftIncidentNarrative: tool({
            description:
              "Produce a draft narrative for one of the three Article 14 reporting phases: `early_warning` (24-hour notification), `incident_report` (72-hour update with assessment + mitigations), or `final_report` (14-day vuln final / one-month incident final). Pulls from the incident record, affected products, and any linked vulnerability. Output is markdown the user reviews and pastes into the incident form in Seentrix.",
            inputSchema: z.object({
              incidentId: z
                .string()
                .uuid()
                .describe("Incident id (from the Incidents screen)."),
              phase: z
                .enum(["early_warning", "incident_report", "final_report"])
                .describe("Which reporting phase to draft."),
            }),
            execute: async ({ incidentId, phase }) => {
              const { data: incident } = await supabase
                .from("incidents")
                .select(
                  "type, severity, title, description, aware_at, affected_product_ids, linked_cve_id, linked_vulnerability_id, early_warning_submitted_at, early_warning_notes, incident_report_submitted_at, incident_report_notes, final_report_notes",
                )
                .eq("id", incidentId)
                .eq("org_id", orgId)
                .maybeSingle();
              if (!incident) return { error: "incident_not_found" };

              const i = incident as Record<string, string | string[] | null>;

              // Resolve affected product names for readability.
              let productNames: string[] = [];
              const productIds =
                (i.affected_product_ids as string[] | null) ?? [];
              if (productIds.length) {
                const { data: products } = await supabase
                  .from("products")
                  .select("id, name")
                  .in("id", productIds)
                  .eq("org_id", orgId);
                productNames =
                  (products as { name: string }[] | null)?.map((p) => p.name) ??
                  [];
              }
              const productList = productNames.length
                ? productNames.join(", ")
                : "[affected product(s)]";

              const awareIso = i.aware_at as string | null;
              const awareLabel = awareIso
                ? new Date(awareIso).toISOString().replace("T", " ").slice(0, 16)
                : "[UTC timestamp of detection]";
              const cveLine = i.linked_cve_id
                ? ` (${i.linked_cve_id})`
                : "";
              const title =
                (i.title as string) || "[concise title of the incident]";
              const description =
                (i.description as string) ||
                "[one-paragraph plain-language description of what happened]";

              const common = `**Organisation:** ${orgId}
**Incident:** ${title}${cveLine}
**Type:** ${(i.type as string) === "security_incident" ? "Severe security incident" : "Actively exploited vulnerability"}
**Severity:** ${(i.severity as string) || "[critical / high / medium / low]"}
**Became aware:** ${awareLabel} UTC
**Affected product(s):** ${productList}
`;

              let draft: string;
              switch (phase) {
                case "early_warning":
                  draft = `# Early warning notification (24 h) — draft

${common}

## Summary (early warning)

${description}

## What we know right now

- **Scope of impact:** [systems / geographies / customer segments affected]
- **Evidence of exploitation:** [logs, threat intelligence, public PoC, CSIRT report]
- **Immediate containment in progress:** [mitigations deployed in the last few hours]

## What we do not yet know

- Root cause
- Full list of affected versions
- Mitigation coverage across the fleet

## Next reporting milestone

We will submit the intermediate incident report within 72 hours of the timestamp above.

---
*Review before use — not legal advice. Submit to the CSIRT designated as coordinator + ENISA via your Member-State channel.*`;
                  break;
                case "incident_report":
                  draft = `# Incident report (72 h) — draft

${common}

## Updated assessment

${i.early_warning_notes ? `### Early-warning context\n${i.early_warning_notes}\n\n` : ""}${description}

## Mitigations applied

- [List the specific controls deployed since the early warning — patches, rules, segment isolations]
- [Indicate which customers / products are covered; which are still exposed]

## Impact assessment

- **Users affected:** [number / percentage]
- **Data involved:** [personal data, configuration, operational telemetry]
- **Operational impact:** [downtime, degraded functionality, none]

## Next steps

- Remaining remediation: [work planned for the next 7–14 days]
- Final report will follow within 14 days of awareness.

---
*Review before use — not legal advice.*`;
                  break;
                case "final_report":
                  draft = `# Final report (14 days / 1 month) — draft

${common}

## Root cause

${i.final_report_notes ? i.final_report_notes + "\n\n" : "[Plain-language explanation of the root cause — design flaw, dependency vulnerability, misconfiguration, supply-chain compromise.]\n\n"}

## Remediation

- **Patch or fix released:** [version, date]
- **Distribution mechanism:** [auto-update, advisory email, manual]
- **Detection for customers:** [how a customer knows they are affected]

## Corrective / preventive actions

- Process changes: [testing, code review, SBOM coverage]
- Tooling changes: [new scanners, SCA coverage, telemetry]
- Timelines: [when each action completes]

## Coordinated disclosure

- Public advisory URL: [link once published]
- CVE id assigned: ${i.linked_cve_id || "[CVE id if applicable]"}

---
*Review before use — not legal advice. Submit before the Article 14 deadline (14 days for actively-exploited vulnerabilities, one month for severe incidents).*`;
                  break;
              }

              return { draft, phase };
            },
          }),

          // ----------------------------------------------------------
          // draftVulnerabilityResponse
          // ----------------------------------------------------------
          draftVulnerabilityResponse: tool({
            description:
              "Produce a short coordinated-disclosure acknowledgement email addressed to the researcher who submitted a vulnerability report through the public PSIRT intake. Pulls the reporter's details + the report body. Output is markdown; the user copies it into their email client.",
            inputSchema: z.object({
              reportId: z
                .string()
                .uuid()
                .describe("Vulnerability-report id (from the Reports screen)."),
            }),
            execute: async ({ reportId }) => {
              const [{ data: report }, { data: org }] = await Promise.all([
                supabase
                  .from("vulnerability_reports")
                  .select(
                    "reporter_name, reporter_email, reporter_handle, title, affected_product, severity_suggested, status, created_at",
                  )
                  .eq("id", reportId)
                  .eq("org_id", orgId)
                  .maybeSingle(),
                supabase
                  .from("organizations")
                  .select("name, legal_name, security_contact_email")
                  .eq("id", orgId)
                  .maybeSingle(),
              ]);
              if (!report) return { error: "report_not_found" };
              if (!org) return { error: "org_not_found" };

              const r = report as Record<string, string | null>;
              const o = org as Record<string, string | null>;
              const orgName = o.legal_name || o.name || "[Organisation]";
              const sig = o.security_contact_email
                ? `The ${orgName} Security Team\n${o.security_contact_email}`
                : `The ${orgName} Security Team`;

              const to =
                r.reporter_email ||
                `[researcher email — not provided in the report]`;
              const name =
                r.reporter_name ||
                r.reporter_handle ||
                "[researcher name or handle]";

              const reportedOn = r.created_at
                ? new Date(r.created_at as string)
                    .toISOString()
                    .slice(0, 10)
                : "[date reported]";

              const draft = `# Researcher acknowledgement (draft)

**To:** ${to}
**Subject:** ${orgName} · Vulnerability report received — ${r.title ?? "[report title]"}

Hi ${name},

Thank you for reporting a potential security issue to ${orgName} on ${reportedOn}. We have received the report titled "${r.title ?? "[title]"}" covering ${r.affected_product ?? "[affected product]"} and logged it for triage.

Our current assessment:
- Severity (preliminary): ${r.severity_suggested ?? "[pending triage]"}
- Status: ${r.status ?? "triage in progress"}

Next steps from our side:
1. We will complete an initial technical validation within five business days.
2. If the report is confirmed, we will agree a coordinated-disclosure timeline with you before any public advisory.
3. We will keep you in the loop as we move from triage to fix to release.

If you have additional details — proof-of-concept, reproduction steps, CVSS vector — please reply to this thread. We do not ask you to hold the report beyond what is needed to protect users.

Kind regards,
${sig}

---
*Review before use — not legal advice. Adjust the timeline to match your actual VDP SLA before sending.*`;

              return { draft };
            },
          }),
        }
      : {}),
  };
}
