import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { EndUserInfoPdf } from "@/lib/pdf/templates/end-user-info";
import type { Locale } from "@/lib/pdf/i18n/pdf-messages";

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
        "name, type, description, support_period_start, support_period_end, update_channel, declaration_version, declaration_issued_at",
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

  const acceptLang = req.headers.get("accept-language") ?? "";
  const locale: Locale = acceptLang.toLowerCase().startsWith("de")
    ? "de"
    : "en";

  const fmt = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString(
          locale === "de" ? "de-DE" : "en-US",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : "";

  const origin = new URL(req.url).origin;
  const securityPublicEnabled = Boolean(
    (org as unknown as { security_public_enabled: boolean })
      .security_public_enabled,
  );
  const disclosureUrl =
    securityPublicEnabled && o.slug
      ? `${origin}/${locale}/security/${o.slug}`
      : "";

  const data: Record<string, string> = {
    productName: p.name ?? "",
    productType: p.type ?? "",
    productIdentification: p.description ?? "",
    manufacturerName,
    manufacturerAddress: addressParts.join(", "),
    cybersecurityContact: o.contact_email ?? "",
    website: o.website ?? "",
    supportStart: fmt(p.support_period_start),
    supportEnd: fmt(p.support_period_end),
    updateChannel: p.update_channel ?? "",
    disclosureUrl,
    secureUseInstructions: "",
    declarationVersion: p.declaration_version ?? "",
    declarationIssuedAt: fmt(p.declaration_issued_at),
  };

  const messages =
    locale === "de"
      ? {
          title: "Cybersicherheits-Informationen für Endnutzer",
          subtitle:
            "Dokument gemäß CRA Artikel 13 und Anhang II(3). Begleitet das Produkt beim Inverkehrbringen.",
          section1: "1. Produktidentifizierung",
          productName: "Produktname",
          productType: "Typ",
          productIdentification: "Kennzeichnung",
          section2: "2. Hersteller und Cybersicherheits-Kontakt",
          manufacturer: "Hersteller",
          manufacturerAddress: "Anschrift",
          cybersecurityContact: "Cybersicherheits-Kontakt",
          website: "Website",
          section3: "3. Support-Zeitraum und Update-Kanal",
          supportStart: "Support beginnt",
          supportEnd: "Support endet",
          updateChannel: "Update-Kanal",
          updateChannelTbd: "Wird dem Nutzer beim Rollout bekannt gegeben",
          supportNote:
            "Sicherheitsupdates werden innerhalb des Support-Zeitraums kostenfrei und ohne ungebührliche Verzögerung bereitgestellt (CRA Artikel 13(8)).",
          section4: "4. Schwachstellen melden",
          disclosureIntro:
            "Wir führen eine Richtlinie zur koordinierten Offenlegung. Bitte melden Sie sicherheitsrelevante Probleme über folgenden Kanal — wir bestätigen innerhalb von 5 Arbeitstagen.",
          disclosureUrl: "Meldeseite",
          section5: "5. Hinweise zur sicheren Nutzung",
          secureUseDefault:
            "Verwenden Sie das Produkt gemäß der beiliegenden Bedienungsanleitung. Halten Sie das Produkt stets auf dem neuesten Stand. Konfigurieren Sie Zugangsdaten selbst und ersetzen Sie Werkseinstellungen, bevor das Produkt in Betrieb geht.",
          section6: "6. Bezug zur Konformitätserklärung",
          docVersion: "Version der DoC",
          docIssued: "Ausgestellt am",
        }
      : {
          title: "End-User Cybersecurity Information",
          subtitle:
            "Document required by CRA Article 13 and Annex II(3). Accompanies the product when placed on the EU market.",
          section1: "1. Product identification",
          productName: "Product name",
          productType: "Type",
          productIdentification: "Identification",
          section2: "2. Manufacturer and cybersecurity contact",
          manufacturer: "Manufacturer",
          manufacturerAddress: "Address",
          cybersecurityContact: "Cybersecurity contact",
          website: "Website",
          section3: "3. Support period and update channel",
          supportStart: "Support starts",
          supportEnd: "Support ends",
          updateChannel: "Update channel",
          updateChannelTbd:
            "Communicated to users at product rollout",
          supportNote:
            "Security updates are provided free of charge and without undue delay throughout the support period (CRA Article 13(8)).",
          section4: "4. Reporting vulnerabilities",
          disclosureIntro:
            "We operate a coordinated vulnerability disclosure policy. Please report security issues through the channel below — we acknowledge within 5 business days.",
          disclosureUrl: "Reporting URL",
          section5: "5. Secure-use guidance",
          secureUseDefault:
            "Use the product according to the accompanying user manual. Keep the product current with security updates. Replace any factory-default credentials before deployment.",
          section6: "6. Declaration of Conformity reference",
          docVersion: "DoC version",
          docIssued: "Issued on",
        };

  const generatedAt = new Date().toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

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
