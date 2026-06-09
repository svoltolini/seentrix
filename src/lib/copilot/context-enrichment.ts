import type { CopilotContext } from "./prompt";
import {
  getOnboardingSnapshot,
} from "@/lib/onboarding-state-server";
import { onboardingStateToPromptBlock } from "@/lib/onboarding-state";

/**
 * Turn the raw `page.path` hint from the client into a rich context
 * payload for the system prompt. The client only needs to know the URL
 * it's currently on — the server takes over from there, looking up the
 * product, counting SBOM components + severities, checking DoC status,
 * and measuring conformity-step progress.
 *
 * Scoped per `org_id` so there's no cross-tenant leak even when the
 * client is lying about the path. The Supabase client passed in is the
 * *user's* authenticated client, so RLS enforces the scoping for every
 * child table (sboms, sbom_components, vulnerabilities, …) via the
 * products.org_id chain.
 */

interface EnrichArgs {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  orgId: string;
  plan: string;
  locale: "en" | "de" | "fr" | "it";
  pagePath?: string;
  orgName?: string;
  orgCountry?: string;
}

const SECTION_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  incidents: "Incidents",
  "vulnerability-reports": "Vulnerability Reports",
  academy: "Academy",
  settings: "Settings",
};

const PRODUCT_TAB_TITLES: Record<string, string> = {
  sbom: "SBOM",
  vulnerabilities: "Vulnerabilities",
  documents: "Documents",
  diagrams: "Diagrams & Evidence",
  "risk-assessment": "Risk Assessment",
  "technical-file": "Technical File",
  identity: "Identity & CE",
  lifecycle: "Lifecycle & Supply Chain",
  readiness: "CRA Readiness",
  "technical-documentation": "Technical documentation",
  incidents: "Incidents",
  academy: "Team training",
  activity: "Activity log",
};

export async function enrichPageContext(
  args: EnrichArgs,
): Promise<CopilotContext> {
  const {
    supabase,
    orgId,
    plan,
    locale,
    pagePath,
    orgName,
    orgCountry,
  } = args;

  // Org-level onboarding/project state is page-independent — compute it once
  // and attach to the base context so "what do I do next?" is always grounded
  // in the org's real progress, no matter which screen the user is on. A
  // failure here is non-fatal: we fall back to a context without project state.
  let projectState: string | undefined;
  try {
    const snapshot = await getOnboardingSnapshot({ supabase, orgId });
    projectState = onboardingStateToPromptBlock(snapshot);
  } catch (err) {
    console.error("[copilot] onboarding snapshot failed", err);
  }

  const base: CopilotContext = {
    locale,
    orgName,
    orgCountry,
    plan,
    projectState,
  };

  if (!pagePath) return base;

  const path = pagePath.replace(/^\/en(\/|$)/, "/");

  // ---- Top-level section title -------------------------------------------
  const sectionMatch = path.match(/^\/app\/([^/?#]+)/);
  const section = sectionMatch?.[1];
  const sectionTitle = section ? SECTION_TITLES[section] : undefined;

  // ---- Product detail + tab ---------------------------------------------
  const productMatch = path.match(/^\/app\/products\/([^/?#]+)(?:\/([^/?#]+))?/);
  let productId = productMatch?.[1];
  const productTab = productMatch?.[2];
  if (productId && productId === "new") productId = undefined;

  let pageTitle = sectionTitle;
  let productName: string | undefined;
  let productType: string | undefined;
  let situation: string | undefined;

  if (productId) {
    // Parallel fetch: product + active SBOM + conformity steps. Every
    // query relies on RLS via products.org_id; only the products row
    // explicitly filters on org_id because that's the one table where
    // the column lives directly.
    const [
      { data: product },
      { data: sbomRows },
      { data: stepRows },
      { data: openVulns },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, type, cra_category, requires_notified_body, declaration_version, declaration_issued_at, support_period_start, support_period_end",
        )
        .eq("id", productId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("sboms")
        .select(
          "id, created_at, last_scanned_at, sbom_format, total_components, vulnerability_count, critical_count, high_count, medium_count, low_count, kev_count, is_active",
        )
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("product_conformity_steps")
        .select("step_key, status")
        .eq("product_id", productId),
      // Count only vulnerabilities that are still open or in progress.
      // Walk through sbom_components → sboms → products via !inner so
      // RLS applies per-row.
      supabase
        .from("vulnerabilities")
        .select(
          "severity, status, sbom_components!inner(sboms!inner(product_id))",
          { count: "exact" },
        )
        .eq("sbom_components.sboms.product_id", productId)
        .in("status", ["open", "in_progress"]),
    ]);

    if (product) {
      productName = (product as { name?: string }).name;
      productType = (product as { type?: string }).type;

      const tabTitle = productTab ? PRODUCT_TAB_TITLES[productTab] : undefined;
      pageTitle = tabTitle
        ? `${tabTitle} · ${productName}`
        : `Product · ${productName}`;

      const lines: string[] = [];

      // ---- SBOM ---------------------------------------------------------
      const sbom = (
        sbomRows as
          | {
              created_at: string;
              last_scanned_at: string | null;
              sbom_format: string | null;
              total_components: number | null;
              critical_count: number | null;
              high_count: number | null;
              medium_count: number | null;
              low_count: number | null;
              kev_count: number | null;
            }[]
          | null
      )?.[0];

      if (sbom) {
        const scanRef = sbom.last_scanned_at ?? sbom.created_at;
        const ageDays = Math.floor(
          (Date.now() - new Date(scanRef).getTime()) / (1000 * 60 * 60 * 24),
        );
        const freshness =
          ageDays <= 1 ? "today" : `${ageDays} day${ageDays === 1 ? "" : "s"} ago`;
        const fmt = (sbom.sbom_format ?? "").toString();
        lines.push(
          `active SBOM uploaded ${freshness}${
            fmt ? ` (${fmt})` : ""
          } with ${sbom.total_components ?? "?"} components`,
        );

        const sevParts: string[] = [];
        if (sbom.critical_count) sevParts.push(`${sbom.critical_count} critical`);
        if (sbom.high_count) sevParts.push(`${sbom.high_count} high`);
        if (sbom.medium_count) sevParts.push(`${sbom.medium_count} medium`);
        if (sbom.low_count) sevParts.push(`${sbom.low_count} low`);
        if (sevParts.length) {
          lines.push(`SBOM vulnerability totals: ${sevParts.join(", ")}`);
        } else {
          lines.push("no known vulnerabilities in the active SBOM");
        }
        if (sbom.kev_count) {
          lines.push(
            `${sbom.kev_count} of those are on CISA's Known Exploited Vulnerabilities list`,
          );
        }
      } else {
        lines.push("no SBOM uploaded yet");
      }

      // ---- Open vs total vulnerabilities -------------------------------
      const openRows =
        (openVulns as { severity: string }[] | null) ?? [];
      if (openRows.length) {
        const openBySev = openRows.reduce<Record<string, number>>(
          (acc, v) => {
            acc[v.severity] = (acc[v.severity] ?? 0) + 1;
            return acc;
          },
          {},
        );
        const critOpen = openBySev.critical ?? 0;
        const highOpen = openBySev.high ?? 0;
        if (critOpen + highOpen > 0) {
          lines.push(
            `${critOpen} critical + ${highOpen} high vulnerabilities are currently open or in progress (not yet resolved or accepted)`,
          );
        } else {
          lines.push(
            `${openRows.length} lower-severity vulnerabilities are still open`,
          );
        }
      } else if (sbom) {
        lines.push(
          "every vulnerability from the SBOM has been triaged (resolved or accepted)",
        );
      }

      // ---- Declaration of Conformity ----------------------------------
      const docVersion = (
        product as { declaration_version?: string | null }
      ).declaration_version;
      const docIssuedAt = (
        product as { declaration_issued_at?: string | null }
      ).declaration_issued_at;
      if (docVersion && docIssuedAt) {
        lines.push(
          `Declaration of Conformity v${docVersion} issued ${docIssuedAt.slice(0, 10)}`,
        );
      } else {
        lines.push("Declaration of Conformity not yet issued");
      }

      // ---- Support period ---------------------------------------------
      const supportEnd = (
        product as { support_period_end?: string | null }
      ).support_period_end;
      if (supportEnd) {
        lines.push(`support period ends ${supportEnd.slice(0, 10)}`);
      }

      // ---- Conformity step progress -----------------------------------
      const steps =
        (stepRows as { step_key: string; status: string }[] | null) ?? [];
      if (steps.length) {
        const completed = steps.filter((s) => s.status === "complete").length;
        const applicable = steps.filter(
          (s) => s.status !== "not_applicable",
        ).length;
        lines.push(
          `conformity-assessment progress: ${completed} of ${applicable} applicable steps marked complete`,
        );
      }

      if (lines.length) situation = lines.map((l) => `- ${l}`).join("\n");
    }
  }

  return {
    ...base,
    pageTitle,
    pagePath: path,
    productName,
    productType,
    situation,
    projectState,
  };
}
