import { tool } from "ai";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";

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
}

export function buildCopilotTools({ supabase, orgId }: Ctx) {
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

    // -------------------------------------------------------------------
    // linkToPage — render a "Go to X" button in the chat.
    // -------------------------------------------------------------------
    linkToPage: tool({
      description:
        "Surface a clickable button in the chat that takes the user to a specific Seentrix screen. Use this instead of embedding a URL in prose whenever you reference a concrete in-product location. Valid path patterns: /app/dashboard, /app/products, /app/products/{productId}, /app/products/{productId}/sbom, /app/products/{productId}/vulnerabilities, /app/products/{productId}/documents, /app/incidents, /app/vulnerability-reports, /app/academy, /app/settings, /app/settings/{tab}.",
      inputSchema: z.object({
        path: z
          .string()
          .regex(/^\/app\//)
          .describe("Path starting with /app/"),
        label: z
          .string()
          .min(1)
          .max(60)
          .describe("Short label shown on the button."),
      }),
      execute: async ({ path, label }) => {
        // Pure UI primitive — the client renders a link button from this
        // tool-result part. No side effect server-side.
        return { path, label };
      },
    }),

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
  };
}
