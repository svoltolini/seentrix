"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = ["free", "professional", "business", "enterprise"] as const;

const tierFeatures: Record<string, string[]> = {
  free: ["f1", "f2", "f3"],
  professional: ["f1", "f2", "f3", "f4"],
  business: ["f1", "f2", "f3", "f4"],
  enterprise: ["f1", "f2", "f3", "f4"],
};

export function PricingPreview() {
  const t = useTranslations("landing.pricingPreview");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-pricing-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-20 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const isPro = tier === "professional";
            const isEnterprise = tier === "enterprise";
            const features = tierFeatures[tier];

            const cardContent = (
              <div
                className={cn(
                  "relative flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1",
                  isPro
                    ? "bg-white/[0.06]"
                    : "rounded-2xl bg-white/[0.03] hover:bg-white/[0.05]"
                )}
              >
                <div className="mb-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {t(`${tier}.name`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`${tier}.description`)}
                  </p>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-5xl font-extrabold",
                      isPro
                        ? "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent"
                        : "text-foreground"
                    )}
                  >
                    {t(`${tier}.price`)}
                  </span>
                  {tier !== "free" && (
                    <span className="text-sm text-muted-foreground">
                      {t(`${tier}.period`)}
                    </span>
                  )}
                </div>

                <div className="my-6 h-px bg-border/50" />

                <ul className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                  {features.map((fk) => (
                    <li key={fk} className="flex items-start gap-2.5">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-0.5 shrink-0 text-primary"
                      >
                        <path
                          d="M13.3 4.3 6.5 11.1 2.7 7.3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {t(`${tier}.features.${fk}`)}
                    </li>
                  ))}
                </ul>

                <Link
                  href={isEnterprise ? "/pricing" : "/auth/signup"}
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                    className: cn(
                      "mt-6 w-full",
                      !isPro &&
                        "bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
                    ),
                  })}
                >
                  {isEnterprise ? t("enterprise.cta") : t("getStarted")}
                </Link>
              </div>
            );

            return (
              <div
                key={tier}
                data-pricing-card
                className={cn(
                  "relative",
                  isPro &&
                    "rounded-[16px] bg-gradient-to-b from-[#3B82F6] via-[#8B5CF6] to-[#F97316] p-px"
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <Badge
                      variant="default"
                      className="border-primary bg-primary text-primary-foreground"
                    >
                      {t("professional.badge")}
                    </Badge>
                  </div>
                )}
                {isPro ? (
                  <div className="h-full overflow-hidden rounded-[15px] bg-background">
                    {cardContent}
                  </div>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>

        {/* CTA — links directly to the #compare anchor on /pricing so
            the user lands on the full feature matrix without scrolling
            past the cards again. Deliberately loud (gradient background,
            large target) because this is the primary 'learn more'
            affordance and it was previously missing. */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <Link
            href="/pricing#compare"
            className="group inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-5 py-3 text-sm font-semibold text-foreground ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:ring-white/[0.16]"
          >
            <span>{t("compareAllFeatures")}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <p className="text-xs text-muted-foreground/60">
            {t("compareAllFeaturesHint")}
          </p>
        </div>
      </div>
    </section>
  );
}
