import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AiContent />;
}

// Four gradients — one per numeral. Same spectrum the landing-page
// CopilotSection uses so the two pages read as one continuous story.
const BULLETS = [
  { key: "sovereign", gradient: "from-[#066DE6] to-[#FF6D00]" },
  { key: "grounded", gradient: "from-[#FF6D00] to-[#EC4899]" },
  { key: "context", gradient: "from-[#F59E0B] to-[#FF6D00]" },
  { key: "actionable", gradient: "from-[#10B981] to-[#06B6D4]" },
] as const;

// Five long-form sections also get their own numeral gradient.
const SECTION_GRADIENTS = [
  "from-[#066DE6] to-[#FF6D00]",
  "from-[#FF6D00] to-[#EC4899]",
  "from-[#EC4899] to-[#F59E0B]",
  "from-[#F59E0B] to-[#10B981]",
  "from-[#10B981] to-[#06B6D4]",
] as const;

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

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
      {/* Hero — borderless, eyebrow as bare tracked uppercase string.
          Matches the CopilotSection header treatment on the landing. */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <span className="text-l6-plus uppercase tracking-[0.18em] text-[#066DE6]">
          {t("eyebrow")}
        </span>
        <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
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

      {/* Four pillars — borderless cells, gradient 01/02/03/04 numerals.
          Same layout grammar as the landing CopilotSection. */}
      <section className="border-t border-border/50 bg-card/50 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {BULLETS.map(({ key, gradient }, i) => (
              <div key={key} className="flex flex-col items-start text-left">
                <span
                  className={`bg-gradient-to-r ${gradient} bg-clip-text font-heading text-5xl font-extrabold leading-none tracking-tight text-transparent sm:text-6xl`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                  {t(`bullets.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`bullets.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five long-form sections — big gradient numeral on the left of
          each row, heading + body on the right. Replaces the tiny
          6-px pill that felt like a half-measure. */}
      <section id="how" className="mx-auto max-w-3xl px-6 pt-24 pb-20">
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {tLearn("title")}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          {tLearn("subtitle")}
        </p>
        <div className="mt-16 flex flex-col gap-14">
          {sections.map((s, i) => (
            <div
              key={s}
              className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8"
            >
              <span
                className={`bg-gradient-to-r ${SECTION_GRADIENTS[i]} bg-clip-text font-heading text-5xl font-extrabold leading-none tracking-tight text-transparent sm:w-24 sm:text-6xl`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {tLearn(`${s}.heading`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tLearn(`${s}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quota strip — borderless dark band with 4 plan cells.
          Matches the Problem-section rhythm (section-level band, no
          inner card). Each plan gets its own numeral gradient. */}
      <section className="border-t border-border/50 bg-card/50 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h3 className="text-l6-plus uppercase tracking-[0.18em] text-[#066DE6]">
            {tLearn("quota.title")}
          </h3>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {quotaTiers.map((tier, i) => (
              <div key={tier} className="flex flex-col items-start">
                <span
                  className={`bg-gradient-to-r ${BULLETS[i].gradient} bg-clip-text font-heading text-4xl font-extrabold leading-none tracking-tight text-transparent sm:text-5xl`}
                >
                  {tLearn(`quota.${tier}`).match(/[\d,]+/)?.[0] ?? ""}
                </span>
                <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {TIER_LABELS[tier]}
                </span>
                <span className="mt-1 text-sm text-foreground">
                  {tLearn(`quota.${tier}`).replace(/[\d,]+\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pt-24 text-center">
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
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
