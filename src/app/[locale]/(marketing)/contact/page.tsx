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
        <h1 className="text-h1 tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-6 text-p1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        {/* Highlights — what "more than Business" actually means. */}
        <aside className="lg:sticky lg:top-24">
          <h2 className="text-h4 text-foreground">
            {t("highlights.title")}
          </h2>
          <ul className="mt-6 flex flex-col gap-4">
            {highlightKeys.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon
                    name="TickCircle"
                    size={18}
                    variant="Bold"
                    aria-hidden="true"
                  />
                </span>
                <span className="pt-1.5 text-p2-r text-foreground">
                  {t(`highlights.items.${key}`)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-p3 text-muted-foreground">
            {t("directEmail")}{" "}
            <a
              href="mailto:support@seentrix.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              support@seentrix.com
            </a>
          </p>
        </aside>

        {/* Enquiry form. */}
        <ContactForm />
      </div>
    </div>
  );
}

export const metadata = { title: "Contact" };
