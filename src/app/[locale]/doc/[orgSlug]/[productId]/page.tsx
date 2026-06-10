import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Public simplified Declaration of Conformity (CRA Annex VI). Reachable
 * anonymously when the product has `public_doc_enabled` and its org has
 * `security_public_enabled`. Reads run under the anon role, gated by the
 * RLS policies added in migration 00046 + the existing public-org policy.
 */
export default async function SimplifiedDocPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; productId: string }>;
}) {
  const { locale, orgSlug, productId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, legal_name, address_line1, address_line2, postal_code, city, country, contact_email, website, security_public_enabled",
    )
    .eq("slug", orgSlug)
    .eq("security_public_enabled", true)
    .maybeSingle();
  if (!org) notFound();
  const o = org as Record<string, string | null>;

  const { data: product } = await supabase
    .from("products")
    .select(
      "name, type, model_number, batch_number, serial_number, cra_category, conformity_route, declaration_version, declaration_issued_at, support_period_end, public_doc_enabled",
    )
    .eq("id", productId)
    .eq("org_id", o.id as string)
    .eq("public_doc_enabled", true)
    .maybeSingle();
  if (!product) notFound();
  const p = product as Record<string, string | null>;

  const t = await getTranslations({ locale, namespace: "identity" });

  const manufacturer = o.legal_name || o.name || "";
  const address = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ]
    .filter(Boolean)
    .join(", ");
  const idParts = [
    p.model_number ? `${t("identity.model_number")}: ${p.model_number}` : "",
    p.batch_number ? `${t("identity.batch_number")}: ${p.batch_number}` : "",
    p.serial_number ? `${t("identity.serial_number")}: ${p.serial_number}` : "",
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="overflow-hidden rounded-lg bg-card shadow-card-md">
        <div className="bg-primary px-8 py-6 text-primary-foreground">
          <p className="text-l6-plus uppercase tracking-wider text-primary-foreground/80">
            {t("public.eyebrow")}
          </p>
          <h1 className="mt-1 text-h2 text-primary-foreground">
            {t("public.title")}
          </h1>
          <p className="mt-1 text-p3 text-primary-foreground/90">{manufacturer}</p>
        </div>

        <div className="px-8 py-6">
          <p className="text-p2-r leading-relaxed text-muted-foreground">
            {t("public.statement", { product: p.name ?? "", manufacturer })}
          </p>

          <div className="mt-6">
            <Row label={t("public.product")} value={p.name ?? ""} />
            <Row label={t("public.type")} value={p.type ?? ""} />
            {idParts.length > 0 && (
              <Row label={t("public.identification")} value={idParts.join(" · ")} />
            )}
            <Row
              label={t("public.docVersion")}
              value={
                p.declaration_version
                  ? `${p.declaration_version}${
                      p.declaration_issued_at
                        ? ` · ${new Date(p.declaration_issued_at).toLocaleDateString()}`
                        : ""
                    }`
                  : ""
              }
            />
            <Row
              label={t("public.supportEnd")}
              value={
                p.support_period_end
                  ? new Date(p.support_period_end).toLocaleDateString()
                  : ""
              }
            />
            <Row
              label={t("public.manufacturer")}
              value={[manufacturer, address].filter(Boolean).join(" · ")}
            />
            <Row
              label={t("public.contact")}
              value={[o.contact_email, o.website].filter(Boolean).join(" · ")}
            />
          </div>

          <p className="mt-6 rounded-md bg-muted p-4 text-p3 text-muted-foreground">
            {t("public.fullDocNote")}
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-p4 text-muted-foreground">
        {t("public.footer")}
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:gap-4">
      <span className="w-56 shrink-0 text-l6-plus uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-p3 text-foreground">{value || "—"}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";
