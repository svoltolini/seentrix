import type { CopilotContext } from "./prompt";

/**
 * Turn the raw `page.path` + `product.id` hints from the client into a
 * rich context payload for the system prompt. The client only needs to
 * know the URL it's currently on — the server takes over from there,
 * looking up the product, counting open vulns, checking DoC status.
 *
 * Scoped per `org_id` so there's no cross-tenant leak even when the
 * client is lying about the path.
 */

interface EnrichArgs {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  orgId: string;
  plan: string;
  locale: "en" | "de";
  pagePath?: string;
  orgName?: string;
  orgCountry?: string;
}

// Known top-level tabs → human-readable page title.
const SECTION_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  incidents: "Incidents",
  "vulnerability-reports": "Vulnerability Reports",
  academy: "Academy",
  settings: "Settings",
};

// Which subpath the user is looking at inside a product.
const PRODUCT_TAB_TITLES: Record<string, string> = {
  sbom: "SBOM",
  vulnerabilities: "Vulnerabilities",
  documents: "Documents",
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

  const base: CopilotContext = {
    locale,
    orgName,
    orgCountry,
    plan,
  };

  if (!pagePath) return base;

  // Normalise: strip the locale prefix so matching is locale-agnostic.
  // e.g. "/en/app/products/abc/sbom" → "/app/products/abc/sbom".
  const path = pagePath.replace(/^\/(en|de)(\/|$)/, "/");

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
    // Fetch the product + compute a tiny situation summary in parallel.
    // Every query below is org-scoped via RLS — the caller already set
    // the authenticated context when creating `supabase`.
    const [
      { data: product },
      { data: vulns },
      { data: sboms },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, type, cra_category, declaration_version, declaration_issued_at",
        )
        .eq("id", productId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("vulnerabilities")
        .select("severity, status")
        .eq("product_id", productId)
        .eq("org_id", orgId),
      supabase
        .from("sboms")
        .select("id, created_at, is_active")
        .eq("product_id", productId)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (product) {
      productName = (product as { name?: string }).name;
      productType = (product as { type?: string }).type;

      const tabTitle = productTab ? PRODUCT_TAB_TITLES[productTab] : undefined;
      pageTitle = tabTitle
        ? `${tabTitle} · ${productName}`
        : `Product · ${productName}`;

      // Situation summary: lines the model can cite directly. Keep it
      // terse — this grows the prompt budget on every turn.
      const lines: string[] = [];

      const vulnRows =
        (vulns as { severity: string; status: string }[] | null) ?? [];
      const openBySev = vulnRows
        .filter((v) => v.status === "open" || v.status === "in_progress")
        .reduce<Record<string, number>>((acc, v) => {
          acc[v.severity] = (acc[v.severity] ?? 0) + 1;
          return acc;
        }, {});
      const criticalOpen = openBySev.critical ?? 0;
      const highOpen = openBySev.high ?? 0;
      if (criticalOpen + highOpen > 0) {
        lines.push(
          `${criticalOpen} critical + ${highOpen} high-severity vulnerabilities are open or in progress`,
        );
      } else if (vulnRows.length > 0) {
        lines.push(`no critical/high open vulnerabilities`);
      }

      const latestSbom = (
        sboms as { created_at: string; is_active: boolean }[] | null
      )?.[0];
      if (latestSbom) {
        const ageDays = Math.floor(
          (Date.now() - new Date(latestSbom.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        lines.push(
          `latest SBOM uploaded ${ageDays} day${ageDays === 1 ? "" : "s"} ago`,
        );
      } else {
        lines.push("no SBOM uploaded yet");
      }

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
  };
}
