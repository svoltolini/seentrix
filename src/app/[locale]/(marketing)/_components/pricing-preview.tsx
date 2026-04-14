"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

            const cardInner = (
              <Card
                className={cn(
                  "relative flex h-full flex-col bg-card/80 backdrop-blur-sm",
                  !isPro && "border-border/50",
                  isPro && "border-transparent"
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      variant="default"
                      className="overflow-visible border-primary bg-primary text-primary-foreground"
                    >
                      {t("professional.badge")}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">
                    {t(`${tier}.name`)}
                  </CardTitle>
                  <CardDescription>
                    {t(`${tier}.description`)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-foreground">
                      {t(`${tier}.price`)}
                    </span>
                    {tier !== "free" && (
                      <span className="text-sm text-muted-foreground">
                        {t(`${tier}.period`)}
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                    {features.map((fk) => (
                      <li key={fk} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                          &#10003;
                        </span>
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
                        "w-full",
                        !isPro &&
                          "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      ),
                    })}
                  >
                    {isEnterprise ? t("enterprise.cta") : t("getStarted")}
                  </Link>
                </CardContent>
              </Card>
            );

            return (
              <div
                key={tier}
                data-pricing-card
                className={cn(
                  "transition-transform duration-300 hover:-translate-y-1",
                  isPro && "rounded-2xl bg-gradient-to-b from-[#3B82F6] via-[#8B5CF6] to-[#F97316] p-px"
                )}
              >
                {isPro ? (
                  <div className="h-full rounded-[calc(1rem-1px)] bg-card">
                    {cardInner}
                  </div>
                ) : (
                  cardInner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
