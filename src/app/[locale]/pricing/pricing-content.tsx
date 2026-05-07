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
import { PLAN_PRICES_EUR } from "@/lib/constants/plans";
import {
  FEATURE_CATEGORIES,
  type CellValue,
  type FeatureRow,
  getCell,
} from "@/lib/constants/pricing-features";

type BillingInterval = "monthly" | "annual";

const TIERS: { plan: OrgPlan; highlighted?: boolean }[] = [
  { plan: "free" },
  { plan: "professional", highlighted: true },
  { plan: "business" },
  { plan: "enterprise" },
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
      locale,
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
              : "text-muted-foreground hover:text-foreground",
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
              : "text-muted-foreground hover:text-foreground",
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
          const prices = PLAN_PRICES_EUR[tier.plan];
          const price = interval === "annual" ? prices.annual : prices.monthly;
          const displayPrice =
            isFree || prices.monthly === 0
              ? 0
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
                  ? "bg-muted"
                  : "rounded-md bg-muted hover:bg-muted",
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
                      ? "bg-gradient-to-r from-[#066DE6] to-[#6F4FE0] bg-clip-text text-transparent"
                      : "text-foreground",
                  )}
                >
                  €{displayPrice}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{t("perMonth")}
                </span>
              </div>

              {interval === "annual" && !isFree && (
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
                      className="w-full bg-muted text-foreground hover:bg-muted"
                    >
                      {t("getStarted")}
                    </Button>
                  </Link>
                ) : isEnterprise ? (
                  <a
                    href="mailto:sales@seentrix.com"
                    className="block w-full"
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-muted text-foreground hover:bg-muted"
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
                        "bg-muted text-foreground hover:bg-muted",
                    )}
                    onClick={() => handleSelectPlan(tier.plan)}
                    disabled={loading === tier.plan}
                  >
                    {loading === tier.plan
                      ? t("redirecting")
                      : t("subscribe")}
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
                  "rounded-[16px] bg-gradient-to-b from-[#066DE6] via-[#6F4FE0] to-[#FF6D00] p-px",
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

      {/* Comparison matrix */}
      <ComparisonTable />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison matrix — every feature, every tier.
// Data lives in src/lib/constants/pricing-features.ts; labels come from
// messages/*/pricing.json under comparison.categories.*.rows.*.
// ---------------------------------------------------------------------------

function ComparisonTable() {
  const t = useTranslations("pricing");
  const tc = useTranslations("pricing.comparison");

  const plans: OrgPlan[] = ["free", "professional", "business", "enterprise"];

  return (
    <section id="compare" className="mt-24 scroll-mt-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {tc("title")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {tc("subtitle")}
        </p>
      </div>

      <div className="overflow-hidden rounded-md bg-muted">
        {/* Sticky header with plan names */}
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div />
          {plans.map((p) => (
            <div
              key={p}
              className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t(`plans.${p}.name`)}
            </div>
          ))}
        </div>

        {/* Category blocks */}
        {FEATURE_CATEGORIES.map((category) => (
          <div key={category.key}>
            <div className="grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] border-b border-border bg-muted px-4 py-3 sm:px-6">
              <div className="col-span-5 text-l6-plus uppercase tracking-wider text-foreground/80">
                {tc(`categories.${category.key}.title`)}
              </div>
            </div>
            {category.rows.map((row, idx) => (
              <ComparisonRow
                key={row.key}
                category={category.key}
                row={row}
                plans={plans}
                striped={idx % 2 === 1}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonRow({
  category,
  row,
  plans,
  striped,
}: {
  category: string;
  row: FeatureRow;
  plans: OrgPlan[];
  striped: boolean;
}) {
  const tc = useTranslations("pricing.comparison");
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] items-center border-b border-border px-4 py-3 text-sm sm:px-6",
        striped && "bg-muted",
      )}
    >
      <div className="pr-4 text-foreground/90">
        {tc(`categories.${category}.rows.${row.key}`)}
      </div>
      {plans.map((p) => (
        <Cell key={p} value={getCell(row, p)} />
      ))}
    </div>
  );
}

function Cell({ value }: { value: CellValue }) {
  const tc = useTranslations("pricing.comparison");
  return (
    <div className="flex items-center justify-center text-center">
      {value === true ? (
        <IconCheck />
      ) : value === false ? (
        <IconDash />
      ) : value === "unlimited" ? (
        <span className="text-xl leading-none text-foreground/80">∞</span>
      ) : value === "coming-soon" ? (
        <span className="inline-flex items-center rounded-full bg-[#D97706]/10 px-2 py-0.5 text-l6-plus text-[#D97706]">
          {tc("comingSoon")}
        </span>
      ) : (
        <span className="text-p3 text-muted-foreground">{value}</span>
      )}
    </div>
  );
}

function IconCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      className="text-primary"
      aria-label="Included"
    >
      <path
        d="M13.3 4.3 6.5 11.1 2.7 7.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDash() {
  return (
    <span
      className="text-muted-foreground"
      aria-label="Not included"
    >
      —
    </span>
  );
}
