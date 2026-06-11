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
    <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[1px] text-primary">
          {t.has("eyebrow") ? t("eyebrow") : "Enterprise"}
        </p>
        <h1 className="mt-3 font-heading text-[40px] font-medium tracking-[-0.8px] text-foreground">
          {t("title")}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start lg:gap-16">
        {/* Highlights — what "more than Business" actually means. Sits in a
            soft accent panel so it reads as the "why" beside the form. */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl bg-accent-soft p-7">
            <h2 className="font-heading text-[21px] font-semibold tracking-[-0.3px] text-foreground">
              {t("highlights.title")}
            </h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              {highlightKeys.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon name="check" size={12} variant="Bold" aria-hidden="true" />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-foreground">
                    {t(`highlights.items.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Enquiry form — laid out openly on the page, no heavy card. */}
        <ContactForm />
      </div>
    </div>
  );
}

export const metadata = { title: "Contact" };
