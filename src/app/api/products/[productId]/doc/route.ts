import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePdfBuffer } from "@/lib/pdf/generate";
import type { Locale } from "@/lib/pdf/i18n/pdf-messages";

/**
 * Stream a Declaration of Conformity PDF, auto-filled from the product +
 * organization + conformity state. Uses the existing
 * /lib/pdf/templates/declaration-of-conformity.tsx template.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
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
    conformityStatement: `${manufacturerName} declares under its sole responsibility that the product named above is in conformity with Regulation (EU) 2024/2847 (Cyber Resilience Act) and fulfils the essential cybersecurity requirements set out in Annex I. Conformity route: ${p.conformity_route ?? "module_a"}.`,
    standardsApplied:
      "Harmonised standards EN 18031-1, EN 18031-2, EN 18031-3 (where applicable).",
    notifiedBodyName: p.notified_body_name ?? "N/A",
    notifiedBodyNumber: notifiedBodyLine,
    signatoryName: o.signatory_name ?? "",
    signatoryPosition: o.signatory_position ?? "",
    place: o.city ?? "",
    date: p.declaration_issued_at
      ? new Date(p.declaration_issued_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    version: p.declaration_version ?? "",
    issuedAt: p.declaration_issued_at
      ? new Date(p.declaration_issued_at).toLocaleDateString()
      : "",
  });

  const acceptLang = req.headers.get("accept-language") ?? "";
  const locale: Locale = acceptLang.toLowerCase().startsWith("de") ? "de" : "en";

  const buffer = await generatePdfBuffer({
    documentType: "declaration_of_conformity",
    content,
    locale,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="declaration-of-conformity-${productId.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
