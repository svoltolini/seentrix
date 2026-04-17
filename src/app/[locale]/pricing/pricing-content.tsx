"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { Link } from "@/i18n/navigation";
import type { OrgPlan } from "@/lib/constants/plans";

type BillingInterval = "monthly" | "annual";

const TIERS: {
  plan: OrgPlan;
  priceMonthly: number;
  priceAnnual: number;
  highlighted?: boolean;
}[] = [
  { plan: "free", priceMonthly: 0, priceAnnual: 0 },
  { plan: "professional", priceMonthly: 49, priceAnnual: 490, highlighted: true },
  { plan: "business", priceMonthly: 199, priceAnnual: 1990 },
  { plan: "enterprise", priceMonthly: 499, priceAnnual: 4990 },
];

export function PricingContent() {
  const t = useTranslations("pricing");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectPlan(plan: OrgPlan) {
    if (plan === "free") return;
    if (plan === "enterprise") return;

    setLoading(plan);

    const result = await createCheckoutSession(
      plan as Exclude<OrgPlan, "free">,
      interval,
      locale
    );

    if (result.url) {
      window.location.href = result.url;
    } else {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="mb-12 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            interval === "monthly"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => setInterval("annual")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            interval === "annual"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("annual")}
          <Badge>{t("savePercent")}</Badge>
        </button>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const isPro = tier.highlighted;
          const isEnterprise = tier.plan === "enterprise";
          const isFree = tier.plan === "free";
          const price =
            isEnterprise
              ? tier.priceMonthly
              : interval === "annual"
                ? tier.priceAnnual
                : tier.priceMonthly;
          const displayPrice =
            isEnterprise || isFree
              ? price
              : interval === "annual"
                ? Math.round(price / 12)
                : price;

          const features: string[] = [];
          for (let i = 1; i <= 8; i++) {
            const key = `plans.${tier.plan}.features.f${i}`;
            if (t.has(key)) features.push(t(key));
          }

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
                  {t(`plans.${tier.plan}.name`)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`plans.${tier.plan}.description`)}
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
                  €{displayPrice}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{t("perMonth")}
                </span>
              </div>

              {interval === "annual" && !isFree && !isEnterprise && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("billedAnnually", { total: price })}
                </p>
              )}

              <div className="my-6 h-px bg-border/50" />

              <ul className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
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
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isFree ? (
                  <Link href="/app/dashboard" className="block w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
                    >
                      {t("getStarted")}
                    </Button>
                  </Link>
                ) : isEnterprise ? (
                  <a href="mailto:sales@seentrix.com" className="block w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
                    >
                      {t("contactSales")}
                    </Button>
                  </a>
                ) : (
                  <Button
                    size="sm"
                    className={cn(
                      "w-full",
                      !isPro &&
                        "bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
                    )}
                    onClick={() => handleSelectPlan(tier.plan)}
                    disabled={loading === tier.plan}
                  >
                    {loading === tier.plan ? t("redirecting") : t("subscribe")}
                  </Button>
                )}
              </div>
            </div>
          );

          return (
            <div
              key={tier.plan}
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
                    {t("mostPopular")}
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
    </div>
  );
}
