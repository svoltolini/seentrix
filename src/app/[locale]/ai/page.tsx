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

function AiContent() {
  const t = useTranslations("copilot.marketing");
  const tLearn = useTranslations("copilot.learnMore");

  const bullets = ["sovereign", "grounded", "context", "actionable"] as const;
  const sections = ["section1", "section2", "section3", "section4", "section5"] as const;
  const quotaTiers = ["free", "professional", "business", "enterprise"] as const;

  return (
    <main className="pb-24">
      {/* Hero ------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#60A5FA]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93C5FD] ring-1 ring-[#60A5FA]/20">
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

      {/* Four pillars ----------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {bullets.map((key) => (
            <div
              key={key}
              className="rounded-2xl bg-card p-6 ring-1 ring-border"
            >
              <h3 className="font-heading text-base font-semibold text-foreground">
                {t(`bullets.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`bullets.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Five long-form sections ----------------------------------------- */}
      <section id="how" className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {tLearn("title")}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          {tLearn("subtitle")}
        </p>
        <div className="mt-12 flex flex-col gap-10">
          {sections.map((s, i) => (
            <div key={s} className="relative pl-8">
              <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#60A5FA]/12 text-[11px] font-semibold text-[#93C5FD] ring-1 ring-[#60A5FA]/20">
                {i + 1}
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {tLearn(`${s}.heading`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {tLearn(`${s}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quota strip ------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-2xl bg-card p-6 ring-1 ring-border sm:p-8">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {tLearn("quota.title")}
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {quotaTiers.map((tier) => (
              <div key={tier} className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tier === "free"
                    ? "Free"
                    : tier === "professional"
                      ? "Professional"
                      : tier === "business"
                        ? "Business"
                        : "Enterprise"}
                </span>
                <span className="font-heading text-base font-semibold text-foreground">
                  {tLearn(`quota.${tier}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA ------------------------------------------------------- */}
      <section className="mx-auto max-w-3xl px-6 text-center">
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
