import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePdfBuffer } from "@/lib/pdf/generate";
import { getOrgPlan } from "@/lib/entitlements";
import { canGeneratePdf } from "@/lib/constants/plans";

/**
 * Stream an Authorised Representative mandate PDF (CRA Article 18),
 * auto-filled from the organisation. The org's own block is pre-filled based
 * on its economic-operator role (a manufacturer fills the principal side, an
 * authorised representative fills the representative side); the counterparty
 * and scope are left as fill-in lines.
 */
const BLANK = "____________________________";

const MANDATE_TASKS =
  "Under this mandate the authorised representative shall: (a) keep the EU declaration of conformity and the technical documentation at the disposal of market surveillance authorities for the period referred to in Article 13(13); (b) further to a reasoned request from a market surveillance authority, provide that authority with all information and documentation necessary to demonstrate the conformity of the product with digital elements; (c) cooperate with the market surveillance authorities, at their request, on any action taken to eliminate the risks posed by the product covered by the mandate; (d) inform the manufacturer without delay where it has reason to believe that the product presents a significant cybersecurity risk; and (e) terminate the mandate if the manufacturer acts contrary to its obligations under Regulation (EU) 2024/2847.";

const MANDATE_TERM =
  "This mandate takes effect on the date of signature and remains in force until terminated in writing by either party. The mandate must permit the authorised representative to perform at least the tasks listed above.";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!canGeneratePdf(await getOrgPlan(supabase, orgId))) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "name, legal_name, registration_number, address_line1, address_line2, postal_code, city, country, entity_type",
    )
    .eq("id", orgId)
    .single();
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const o = org as Record<string, string | null>;

  const orgName = o.legal_name?.trim() || o.name || "";
  const orgAddress = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Pre-fill the side the org plays; leave the counterparty blank.
  const isRepresentative = o.entity_type === "authorised_representative";
  const content = JSON.stringify({
    manufacturerName: isRepresentative ? BLANK : orgName,
    manufacturerAddress: isRepresentative ? BLANK : orgAddress,
    representativeName: isRepresentative ? orgName : BLANK,
    representativeAddress: isRepresentative ? orgAddress : BLANK,
    scope: BLANK,
    tasks: MANDATE_TASKS,
    term: MANDATE_TERM,
    place: o.city ?? "",
    date: new Date().toLocaleDateString(),
  });

  const buffer = await generatePdfBuffer({
    documentType: "authorised_representative_mandate",
    content,
    locale: "en",
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="authorised-representative-mandate-${orgId.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
