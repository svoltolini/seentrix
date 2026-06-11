"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { Link } from "@/i18n/navigation";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRICES_EUR, isPurchasable } from "@/lib/constants/plans";
import {
  FEATURE_CATEGORIES,
  type CellValue,
  type FeatureRow,
  getCell,
} from "@/lib/constants/pricing-features";

type BillingInterval = "monthly" | "annual";

// Only three self-serve tiers are shown as cards now. Enterprise is no longer
// a fourth card/column — organisations with larger or bespoke requirements are
// routed to the "Need more than Business?" contact band below, where pricing is
// scoped to their needs. Giving each tier its own third of the row (instead of
// a quarter) leaves real room for feature copy and a more legible comparison
// table. `enterprise` still exists in OrgPlan for internal gating; it is simply
// not presented as a buyable card.
const TIERS: { plan: OrgPlan; highlighted?: boolean }[] = [
  { plan: "free" },
  { plan: "professional", highlighted: true },
  { plan: "business" },
];

export function PricingContent() {
  const t = useTranslations("pricing");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectPlan(plan: OrgPlan) {
    if (plan === "free") return;
    if (!isPurchasable(plan)) return;

    setLoading(plan);

    const result = await createCheckoutSession(plan, interval);

    if (result.url) {
      // Use assign() rather than mutating location.href so the React
      // Compiler's immutability rule doesn't flag an external-variable write.
      window.location.assign(result.url);
    } else {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h1 className="text-h1 tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-6 text-p1 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Billing toggle — segmented control. `aria-pressed` lets a screen
          reader announce which interval is active; without it the two
          buttons read as unrelated toggles. */}
      <div
        role="group"
        aria-label={t("billingInterval")}
        className="mb-12 flex items-center justify-center gap-1 rounded-md border border-border bg-card p-1"
      >
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          aria-pressed={interval === "monthly"}
          className={cn(
            "rounded-sm px-4 py-2 text-l6 transition-colors",
            interval === "monthly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => setInterval("annual")}
          aria-pressed={interval === "annual"}
          className={cn(
            "flex items-center gap-2 rounded-sm px-4 py-2 text-l6 transition-colors",
            interval === "annual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("annual")}
          <Badge variant={interval === "annual" ? "solid-translucent" : "accent"}>
            {t("savePercent")}
          </Badge>
        </button>
      </div>

      {/* Pricing cards — three tiers across three columns on desktop so each
          card has room to breathe (was four narrow columns). */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const isPro = tier.highlighted;
          const isFree = tier.plan === "free";
          // A non-free tier that isn't purchasable yet (Enterprise) is shown
          // as "coming soon": no price, no checkout. Driven by plans.ts so
          // adding/removing a purchasable tier needs no edits here.
          const isComingSoon = !isFree && !isPurchasable(tier.plan);
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

          return (
            <div
              key={tier.plan}
              className="relative"
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
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1",
                  isPro
                    ? "border-2 border-primary"
                    : "border border-border",
                )}
              >
                <div className="mb-1">
                  <h3 className="text-h4 text-foreground">
                    {t(`plans.${tier.plan}.name`)}
                  </h3>
                  <p className="mt-1 text-p3 text-muted-foreground">
                    {t(`plans.${tier.plan}.description`)}
                  </p>
                </div>

                {isComingSoon ? (
                  <div className="mt-4 flex min-h-[3.75rem] items-baseline">
                    <span className="text-3xl font-extrabold text-foreground">
                      {t("comingSoon")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-5xl font-extrabold",
                          isPro
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        €{displayPrice}
                      </span>
                      <span className="text-p3 text-muted-foreground">
                        /{t("perMonth")}
                      </span>
                    </div>

                    {interval === "annual" && !isFree && (
                      <p className="mt-1 text-p4-r text-muted-foreground">
                        {t("billedAnnually", { total: price })}
                      </p>
                    )}
                  </>
                )}

                <div className="my-6 h-px bg-border" />

                <ul className="flex flex-1 flex-col gap-3 text-p3 text-muted-foreground">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Icon
                        name="TickCircle"
                        size={16}
                        variant="Bold"
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isFree ? (
                    <Link href="/app/dashboard" className="block w-full">
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full"
                      >
                        {t("getStarted")}
                      </Button>
                    </Link>
                  ) : isComingSoon ? (
                    <Button
                      variant="secondary"
                      size="default"
                      className="w-full"
                      disabled
                      aria-disabled="true"
                    >
                      {t("comingSoon")}
                    </Button>
                  ) : (
                    <Button
                      variant={isPro ? "default" : "outline"}
                      size="default"
                      className="w-full"
                      onClick={() => handleSelectPlan(tier.plan)}
                      disabled={loading === tier.plan}
                    >
                      {loading === tier.plan ? (
                        <>
                          <Icon name="Loader2" className="size-4 animate-spin" />
                          {t("redirecting")}
                        </>
                      ) : (
                        t("subscribe")
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise / custom-requirements contact band — replaces the old
          fourth "Enterprise" card. Organisations that have outgrown Business
          (large portfolios, SSO, parent-child groups, custom SLA) are priced
          per requirement, so we route them to a conversation rather than a
          fixed public number. */}
      <EnterpriseBand />

      {/* Comparison matrix */}
      <ComparisonTable />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enterprise band — full-width "Need more than Business?" CTA that replaces
// the old fourth pricing card. Routes custom-requirement buyers to /contact,
// where pricing is scoped to their portfolio/SSO/SLA needs rather than fixed
// to a public number.
// ---------------------------------------------------------------------------

function EnterpriseBand() {
  const t = useTranslations("pricing.enterpriseBand");
  const bullets = ["b1", "b2", "b3"] as const;

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-6 rounded-md bg-dark-cta p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-h3 text-primary-foreground">{t("title")}</h2>
          <p className="mt-2 text-p2-r text-primary-foreground/80">
            {t("subtitle")}
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-p3 text-primary-foreground/90"
              >
                <Icon
                  name="TickCircle"
                  size={16}
                  variant="Bold"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary-foreground"
                />
                {t(`bullets.${b}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          <Link href="/contact" className="block">
            <Button
              variant="secondary"
              size="lg"
              className="w-full lg:w-auto"
            >
              {t("cta")}
              <Icon name="ArrowRight2" size={16} aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
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

  // Three columns only — Enterprise is handled by the contact band, so the
  // matrix compares the self-serve tiers a buyer can actually pick. Each
  // column gets ~33% more width than the old four-column layout.
  const plans: OrgPlan[] = ["free", "professional", "business"];

  return (
    <section id="compare" className="mt-24 scroll-mt-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-h2 text-foreground">
          {tc("title")}
        </h2>
        <p className="mt-3 text-p3 text-muted-foreground">
          {tc("subtitle")}
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        {/* Sticky header with plan-name TIER CHIPS — visually mirrors the
            pricing cards above. Highlighted tier (Professional) gets a solid
            primary chip; the rest get an outlined chip on the white card. */}
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] border-b border-border bg-card/95 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center text-p4-r text-muted-foreground">
            {tc("featuresLabel") ?? "Feature"}
          </div>
          {plans.map((p) => {
            const highlighted = p === "professional";
            return (
              <div key={p} className="flex justify-center">
                <span
                  className={cn(
                    "inline-flex h-7 items-center rounded-sm px-3 text-l6",
                    highlighted
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-outline bg-card text-foreground",
                  )}
                >
                  {t(`plans.${p}.name`)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Category blocks */}
        {FEATURE_CATEGORIES.map((category) => (
          <div key={category.key}>
            <div className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] border-y border-border bg-muted px-4 py-3 sm:px-6">
              <div className="col-span-4 text-l6-plus uppercase tracking-wider text-foreground">
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
        "grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] items-center border-b border-border px-4 py-3 text-p3 sm:px-6",
        striped && "bg-muted",
      )}
    >
      <div className="pr-4 text-foreground">
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
        <span className="text-xl leading-none text-foreground">∞</span>
      ) : value === "coming-soon" ? (
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-accent/30 bg-accent/5 px-2 py-0.5 text-l6-plus text-accent">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {tc("comingSoon")}
        </span>
      ) : (
        <span className="text-p3 text-foreground">{value}</span>
      )}
    </div>
  );
}

function IconCheck() {
  return (
    <Icon
      name="TickCircle"
      size={18}
      variant="Bold"
      className="text-primary"
      aria-label="Included"
    />
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
