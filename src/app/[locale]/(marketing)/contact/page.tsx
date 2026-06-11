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
    <div className="mx-auto max-w-[1060px] px-6 py-16 lg:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_460px] lg:gap-20">
        {/* LEFT — editorial pitch column */}
        <div className="lg:sticky lg:top-24">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            {t.has("eyebrow") ? t("eyebrow") : "Enterprise"}
          </p>
          <h1 className="mt-4 font-heading text-[38px] font-medium leading-[1.12] tracking-[-0.8px] text-foreground text-balance sm:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-[48ch] text-[16px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>

          {/* What you get */}
          <div className="mt-10">
            <p className="text-[15px] font-semibold text-foreground">
              {t("highlights.title")}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {highlightKeys.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
                    <Icon name="check" size={12} variant="Bold" aria-hidden="true" />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-muted-foreground">
                    {t(`highlights.items.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct email escape hatch */}
          <p className="mt-10 border-t border-border pt-6 text-[13.5px] text-muted-foreground">
            {t.has("directEmail") ? t("directEmail") : "Prefer email?"}{" "}
            <a
              href="mailto:support@seentrix.com"
              className="font-semibold text-primary hover:underline"
            >
              support@seentrix.com
            </a>
          </p>
        </div>

        {/* RIGHT — the enquiry form (flat bordered card) */}
        <ContactForm />
      </div>
    </div>
  );
}

export const metadata = { title: "Contact" };
