import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <AiContent />;
}

/**
 * Solid colour rotation for the giant decorative numerals across the
 * page. Uses only Nask palette tokens (primary blue + accent orange) —
 * the previous build cycled through six off-palette tones (pink, amber,
 * emerald, cyan) wrapped in CSS gradients, which contradicted the
 * "Nask palette only, no gradient text" rule from the memory.
 *
 * Decorative giant type is the documented exception to the typography
 * scale so `text-5xl/6xl` on these is intentional — they're ornaments,
 * not headings, and don't carry semantic weight.
 */
const NUMERAL_TONES = ["text-primary", "text-accent"] as const;
function numeralTone(i: number): string {
  return NUMERAL_TONES[i % NUMERAL_TONES.length];
}

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

const BULLET_KEYS = ["sovereign", "grounded", "context", "actionable"] as const;

function AiContent() {
  const t = useTranslations("copilot.marketing");
  const tLearn = useTranslations("copilot.learnMore");

  const sections = [
    "section1",
    "section2",
    "section3",
    "section4",
    "section5",
  ] as const;
  const quotaTiers = [
    "free",
    "professional",
    "business",
    "enterprise",
  ] as const;

  return (
    <main className="pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <span className="text-l6-plus uppercase tracking-[2.5px] text-primary">
          {t("eyebrow")}
        </span>
        <h1 className="mt-6 font-heading text-h1 leading-[1.08] tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-3xl text-p1 text-muted-foreground">
          {t("lede")}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/auth/signup">
            <Button size="lg">{t("ctaPrimary")}</Button>
          </Link>
          <Link href="#how">
            <Button size="lg" variant="ghost">
              {t("ctaSecondary")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Four pillars — light Nask cards instead of the previous
          borderless cells. Solid-tone numerals (no gradients), 18 px
          card title, 13 px body. */}
      <section className="border-t border-border/50 bg-muted/30 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {BULLET_KEYS.map((key, i) => (
              <article
                key={key}
                className="flex flex-col rounded-md border border-border bg-card p-6"
              >
                <span
                  className={`font-heading text-5xl font-extrabold leading-none tracking-tight ${numeralTone(i)}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-heading text-h4 text-foreground">
                  {t(`bullets.${key}.title`)}
                </h3>
                <p className="mt-3 text-p3 text-muted-foreground">
                  {t(`bullets.${key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Five long-form sections — numbered rows on the white surface.
          Numeral gets the same primary/accent rotation as the pillars
          above so the page reads as one consistent palette. */}
      <section id="how" className="mx-auto max-w-3xl px-6 pt-24 pb-20">
        <h2 className="font-heading text-h2 text-foreground">
          {tLearn("title")}
        </h2>
        <p className="mt-2 text-p2-r text-muted-foreground">
          {tLearn("subtitle")}
        </p>
        <div className="mt-16 flex flex-col gap-14">
          {sections.map((s, i) => (
            <div
              key={s}
              className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8"
            >
              <span
                className={`font-heading text-5xl font-extrabold leading-none tracking-tight sm:w-24 ${numeralTone(i)}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3 className="font-heading text-h4 text-foreground">
                  {tLearn(`${s}.heading`)}
                </h3>
                <p className="mt-3 text-p3 text-muted-foreground">
                  {tLearn(`${s}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quota strip — light card on a soft band, four plan tiles.
          Big number per tier, label underneath, then the rest of the
          quota copy. */}
      <section className="border-t border-border/50 bg-muted/30 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h3 className="text-l6-plus uppercase tracking-[2.5px] text-primary">
            {tLearn("quota.title")}
          </h3>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quotaTiers.map((tier, i) => {
              const value = tLearn(`quota.${tier}`).match(/[\d,]+/)?.[0] ?? "";
              const remainder = tLearn(`quota.${tier}`).replace(
                /[\d,]+\s*/,
                "",
              );
              return (
                <div
                  key={tier}
                  className="flex flex-col rounded-md border border-border bg-card p-5"
                >
                  <span
                    className={`font-heading text-5xl font-extrabold leading-none tracking-tight tabular-nums ${numeralTone(i)}`}
                  >
                    {value}
                  </span>
                  <span className="mt-3 text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                    {TIER_LABELS[tier]}
                  </span>
                  <span className="mt-1 text-p3 text-foreground">
                    {remainder}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pt-24 text-center">
        <h2 className="font-heading text-h2 text-foreground">
          {t("title")}
        </h2>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/auth/signup">
            <Button size="lg">{t("ctaPrimary")}</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="ghost">
              Pricing →
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export const metadata = {
  title: "Seentrix AI",
  description:
    "The only CRA-specialist AI assistant that runs entirely in the EU. Built into Seentrix.",
};
