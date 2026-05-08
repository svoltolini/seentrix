"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
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
  }, [reduced]);

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
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const isPro = tier === "professional";
            const isEnterprise = tier === "enterprise";
            const features = tierFeatures[tier];

            return (
              <div
                key={tier}
                data-pricing-card
                className="relative"
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
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-md bg-card p-6 shadow-card-md transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg",
                    isPro
                      ? "border-2 border-primary"
                      : "border border-border",
                  )}
                >
                  <div className="mb-1">
                    <h3 className="text-h4 text-foreground">
                      {t(`${tier}.name`)}
                    </h3>
                    <p className="mt-1 text-p3 text-muted-foreground">
                      {t(`${tier}.description`)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-5xl font-extrabold",
                        isPro ? "text-primary" : "text-foreground",
                      )}
                    >
                      {t(`${tier}.price`)}
                    </span>
                    {tier !== "free" && (
                      <span className="text-p3 text-muted-foreground">
                        {t(`${tier}.period`)}
                      </span>
                    )}
                  </div>

                  <div className="my-6 h-px bg-border" />

                  <ul className="flex flex-1 flex-col gap-3 text-p3 text-muted-foreground">
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
                      variant: isPro ? "default" : "outline",
                      size: "default",
                      className: "mt-6 w-full",
                    })}
                  >
                    {isEnterprise ? t("enterprise.cta") : t("getStarted")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA — links directly to the #compare anchor on /pricing so
            the user lands on the full feature matrix without scrolling
            past the cards again. */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <Link
            href="/pricing#compare"
            className="group inline-flex items-center gap-2 rounded-sm border-[1.5px] border-border-outline bg-card px-5 py-3 text-l6 text-foreground transition-colors hover:bg-muted"
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
          <p className="text-p4-r text-muted-foreground">
            {t("compareAllFeaturesHint")}
          </p>
        </div>
      </div>
    </section>
  );
}
