import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { EndUserInfoPdf } from "@/lib/pdf/templates/end-user-info";
import { getEndUserInfoMessages } from "@/lib/pdf/i18n/end-user-info-messages";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/locales";

/**
 * Stream the End-User Cybersecurity Information Sheet — the document
 * required by CRA Article 13 + Annex II(3) to ship with every product
 * placed on the EU market. Built from the same data that populates the
 * product overview + the active support period.
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
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? "";
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: product }, { data: org }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "name, type, description, intended_use, known_risks, support_period_start, support_period_end, update_channel, declaration_version, declaration_issued_at, public_doc_enabled",
      )
      .eq("id", productId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("organizations")
      .select(
        "name, legal_name, address_line1, address_line2, postal_code, city, country, contact_email, website, slug, security_public_enabled",
      )
      .eq("id", orgId)
      .single(),
  ]);
  if (!product || !org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const p = product as Record<string, string | null>;
  const o = org as Record<string, string | null>;

  const manufacturerName = o.legal_name?.trim() || o.name || "";
  const addressParts = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ].filter(Boolean);

  const fmt = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  const origin = new URL(req.url).origin;
  const securityPublicEnabled = Boolean(
    (org as unknown as { security_public_enabled: boolean })
      .security_public_enabled,
  );
  const disclosureUrl =
    securityPublicEnabled && o.slug ? `${origin}/security/${o.slug}` : "";
  // Where the EU DoC can be accessed (Annex II 6/9) — the public simplified DoC
  // when the product is published and the org has public pages enabled.
  const docUrl =
    p.public_doc_enabled && securityPublicEnabled && o.slug
      ? `${origin}/doc/${o.slug}/${productId}`
      : "";

  const data: Record<string, string> = {
    productName: p.name ?? "",
    productType: p.type ?? "",
    productIdentification: p.description ?? "",
    intendedUse: p.intended_use ?? "",
    knownRisks: p.known_risks ?? "",
    manufacturerName,
    manufacturerAddress: addressParts.join(", "),
    cybersecurityContact: o.contact_email ?? "",
    website: o.website ?? "",
    supportStart: fmt(p.support_period_start),
    supportEnd: fmt(p.support_period_end),
    updateChannel: p.update_channel ?? "",
    disclosureUrl,
    docUrl,
    secureUseInstructions: "",
    declarationVersion: p.declaration_version ?? "",
    declarationIssuedAt: fmt(p.declaration_issued_at),
  };

  // Generate in the user's UI language (CRA: user-facing docs follow the market
  // language). Resolve from the NEXT_LOCALE cookie on this download request.
  const locale = localeFromCookieHeader(req.headers.get("cookie"));
  const messages = getEndUserInfoMessages(locale);

  const dateLocaleTag: Record<Locale, string> = {
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    it: "it-IT",
  };
  const generatedAt = new Date().toLocaleDateString(dateLocaleTag[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buffer = await renderToBuffer(
    <EndUserInfoPdf data={data} messages={messages} generatedAt={generatedAt} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="end-user-cybersecurity-info-${productId.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Resolve the active UI locale from the request's Cookie header (NEXT_LOCALE).
 * Falls back to English when absent or unsupported.
 */
function localeFromCookieHeader(cookieHeader: string | null): Locale {
  if (!cookieHeader) return "en";
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === LOCALE_COOKIE) {
      const value = decodeURIComponent(rest.join("="));
      if (isLocale(value)) return value;
    }
  }
  return "en";
}
