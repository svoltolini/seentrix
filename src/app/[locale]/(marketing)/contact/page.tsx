import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/icon";
import { ContactForm } from "./contact-form";

/**
 * /contact — custom-plan / Enterprise enquiry page. Lives under the
 * (marketing) route group so it inherits the landing header + footer chrome.
 * Linked from the "Need more than Business?" band on /pricing and the landing
 * pricing preview.
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const t = await getTranslations("contact");
  const highlightKeys = [
    "scale",
    "sso",
    "monitoring",
    "support",
    "residency",
  ] as const;

  return (
    <div className="mx-auto max-w-[600px] px-6 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[1px] text-primary">
          {t.has("eyebrow") ? t("eyebrow") : "Enterprise"}
        </p>
        <h1 className="mt-3 font-heading text-[36px] font-medium tracking-[-0.8px] text-foreground sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Enquiry form — one clean flat card */}
      <ContactForm />

      {/* What you get — a compact, quiet check strip below the form */}
      <div className="mt-10 border-t border-border pt-8">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[1px] text-muted-foreground">
          {t("highlights.title")}
        </p>
        <ul className="mx-auto mt-5 grid max-w-md gap-x-6 gap-y-3 sm:grid-cols-2">
          {highlightKeys.map((key) => (
            <li key={key} className="flex items-start gap-2.5">
              <Icon
                name="check"
                size={15}
                variant="Bold"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
              />
              <span className="text-[13.5px] leading-relaxed text-muted-foreground">
                {t(`highlights.items.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const metadata = { title: "Contact" };
