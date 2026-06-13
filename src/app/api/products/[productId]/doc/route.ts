import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePdfBuffer } from "@/lib/pdf/generate";
import { getOrgPlan } from "@/lib/entitlements";
import { canGeneratePdf } from "@/lib/constants/plans";
import { toDocLocale, formatDocDate } from "@/lib/pdf/doc-locales";
import { docConformityBoilerplate } from "@/lib/pdf/i18n/market-languages";

/**
 * Stream a Declaration of Conformity PDF, auto-filled from the product +
 * organization + conformity state. Uses the existing
 * /lib/pdf/templates/declaration-of-conformity.tsx template.
 *
 * The output language is chosen via `?lang=` (one of the document locales) —
 * the CRA requires the DoC in the language of the market where the product is
 * sold. Defaults to English.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const locale = toDocLocale(new URL(req.url).searchParams.get("lang"));
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Plan gate: PDF generation is a paid feature.
  if (!canGeneratePdf(await getOrgPlan(supabase, orgId))) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  const [{ data: product }, { data: org }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "name, type, description, cra_category, conformity_route, notified_body_name, notified_body_id, notified_body_scope, declaration_version, declaration_issued_at",
      )
      .eq("id", productId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("organizations")
      .select(
        "name, legal_name, registration_number, address_line1, address_line2, postal_code, city, country, signatory_name, signatory_position, contact_email, website",
      )
      .eq("id", orgId)
      .single(),
  ]);
  if (!product || !org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const p = product as Record<string, string | null>;
  const o = org as Record<string, string | null>;

  // Prefer the registered legal entity name on formal documents; fall back
  // to the display name only if the profile hasn't been completed.
  const manufacturerName = o.legal_name?.trim() || o.name || "";
  const addressParts = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ].filter(Boolean);

  const notifiedBodyLine = p.notified_body_id
    ? `${p.notified_body_name ?? ""} (Notified Body No. ${p.notified_body_id})`
    : "N/A";

  const boilerplate = docConformityBoilerplate(
    locale,
    manufacturerName,
    p.conformity_route ?? "module_a",
  );
  const issuedAtDate = formatDocDate(p.declaration_issued_at, locale);

  const content = JSON.stringify({
    manufacturerName,
    manufacturerAddress: addressParts.join(", "),
    manufacturerRegistration: o.registration_number ?? "",
    manufacturerContact: o.contact_email ?? "",
    manufacturerWebsite: o.website ?? "",
    productName: p.name ?? "",
    productIdentification: [p.type, p.description ?? ""]
      .filter(Boolean)
      .join(" · "),
    conformityStatement: boilerplate.conformityStatement,
    standardsApplied: boilerplate.standardsApplied,
    notifiedBodyName: p.notified_body_name ?? "N/A",
    notifiedBodyNumber: notifiedBodyLine,
    signatoryName: o.signatory_name ?? "",
    signatoryPosition: o.signatory_position ?? "",
    place: o.city ?? "",
    date: issuedAtDate || formatDocDate(new Date().toISOString(), locale),
    version: p.declaration_version ?? "",
    issuedAt: issuedAtDate,
  });

  const buffer = await generatePdfBuffer({
    documentType: "declaration_of_conformity",
    content,
    locale,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="declaration-of-conformity-${productId.slice(0, 8)}-${locale}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
