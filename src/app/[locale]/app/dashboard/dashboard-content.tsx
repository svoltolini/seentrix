"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { SEVERITY_CHART_COLORS } from "../products/[productId]/constants";
import type {
  DashboardStats,
  DashboardProduct,
  ActivityItem,
} from "../products/actions";
import { ComplianceTrendChart } from "./charts/compliance-trend-chart";
import { VulnAgingChart } from "./charts/vuln-aging-chart";
import { ChecklistProgressChart } from "./charts/checklist-progress-chart";
import { OverdueTasksWidget } from "./charts/overdue-tasks-widget";
import { ActivityVelocityChart } from "./charts/activity-velocity-chart";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function relativeTime(
  dateStr: string,
  t: ReturnType<typeof useTranslations>,
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("timeAgo.justNow");
  if (minutes < 60) return t("timeAgo.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("timeAgo.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("timeAgo.daysAgo", { count: days });
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16A34A";
  if (score >= 40) return "#D97706";
  return "#DC2626";
}

/**
 * Pick the product most likely to block the next CRA deadline:
 * lowest compliance_score below the 75% "on track" threshold, with not-yet
 * -assessed products preferred (they haven't even started).
 * Returns null when every product is at or above the threshold.
 */
function findAtRiskProduct(
  products: DashboardProduct[],
): DashboardProduct | null {
  if (products.length === 0) return null;
  const candidates = products.filter((p) => p.compliance_score < 75);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    // not-assessed first (no cra_category), then by lowest score
    const aUn = a.cra_category ? 1 : 0;
    const bUn = b.cra_category ? 1 : 0;
    if (aUn !== bUn) return aUn - bUn;
    return a.compliance_score - b.compliance_score;
  });
  return candidates[0];
}

const CATEGORY_PILL: Record<string, string> = {
  default: "bg-[#2563EB]",
  important_class_i: "bg-[#D97706]",
  important_class_ii: "bg-[#EA580C]",
  critical: "bg-[#DC2626]",
};

const CATEGORY_KEY_MAP: Record<string, string> = {
  default: "categoryDefault",
  important_class_i: "categoryImportantI",
  important_class_ii: "categoryImportantII",
  critical: "categoryCritical",
};

const ACTIVITY_TYPE_PILL: Record<string, string> = {
  assessment: "bg-[#7C3AED]",
  checklist: "bg-[#2563EB]",
  sbom: "bg-[#D97706]",
  document: "bg-[#16A34A]",
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardContent(stats: DashboardStats) {
  const t = useTranslations("dashboard");
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    totalProducts,
    assessedCount,
    avgCompliance,
    totalVulnerabilities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    products,
    recentActivity,
    currentUser,
  } = stats;

  const firstName = currentUser?.full_name?.split(" ")[0] ?? null;

  const deadlines = [
    {
      name: t("deadline.notifiedBodies"),
      date: "2026-06-11",
      dateLabel: t("deadline.notifiedBodiesDate"),
    },
    {
      name: t("deadline.reporting"),
      date: "2026-09-11",
      dateLabel: t("deadline.reportingDate"),
    },
    {
      name: t("deadline.fullCompliance"),
      date: "2027-12-11",
      dateLabel: t("deadline.fullComplianceDate"),
    },
  ];

  const nextDeadline = deadlines.find((dl) => getDaysUntil(dl.date) > 0);
  const atRiskProduct =
    totalProducts > 0 ? findAtRiskProduct(products) : null;

  // --- Counter + progress-bar grow-in animations ---
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Counter numbers (stat cards)
      el.querySelectorAll<HTMLElement>("[data-counter]").forEach((counter) => {
        const target = counter.getAttribute("data-counter") ?? "";
        const match = target.match(/[\d.]+/);
        if (!match) return;
        const endVal = parseFloat(match[0]);
        const prefix = target.slice(0, target.indexOf(match[0]));
        const suffix = target.slice(
          target.indexOf(match[0]) + match[0].length,
        );
        const obj = { val: 0 };
        gsap.to(obj, {
          val: endVal,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 90%",
            once: true,
          },
          onUpdate() {
            counter.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
          },
        });
      });

      // Progress bars grow from 0% to target%
      el.querySelectorAll<HTMLElement>("[data-progress-bar]").forEach(
        (bar) => {
          const target = parseFloat(
            bar.getAttribute("data-progress-bar") ?? "0",
          );
          gsap.fromTo(
            bar,
            { width: "0%" },
            {
              width: `${target}%`,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: bar,
                start: "top 90%",
                once: true,
              },
            },
          );
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mx-auto max-w-[1120px] pb-12">
      <StaggerReveal
        className="space-y-8"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
      >
        {/* ── Header ── */}
        <div
          data-reveal
          className="flex items-end justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-[28px] font-bold tracking-tight">
              {firstName ? t("greeting", { name: firstName }) : t("title")}
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {firstName ? t("greetingSubtitle") : t("subtitle")}
            </p>
          </div>
          {totalProducts > 0 && (
            <Link
              href="/app/products/new"
              className={buttonVariants({ size: "sm" })}
            >
              <HugeIcon
                name="plus-sign-square-stroke-rounded"
                size={14}
                className="text-current"
              />
              {t("addProduct")}
            </Link>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div
          data-reveal
          className="grid grid-cols-2 gap-3 lg:grid-cols-5"
        >
          <StatCard label={t("totalProducts")} from="#2563EB" to="#0891B2">
            <p
              className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white"
              data-counter={String(totalProducts)}
            >
              {totalProducts}
            </p>
          </StatCard>

          <StatCard label={t("assessed")} from="#7C3AED" to="#4F46E5">
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">
              <span data-counter={String(assessedCount)}>{assessedCount}</span>
              <span className="text-base text-white/65">
                {" "}
                / {totalProducts}
              </span>
            </p>
          </StatCard>

          <StatCard label={t("avgCompliance")} from="#16A34A" to="#15803D">
            <p
              className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white"
              data-counter={totalProducts > 0 ? `${avgCompliance}%` : "\u2014"}
            >
              {totalProducts > 0 ? `${avgCompliance}%` : "\u2014"}
            </p>
            {totalProducts > 0 && (
              <div className="mt-2.5 h-3 overflow-hidden rounded-[3px] bg-black/25">
                <div
                  className="h-full rounded-[3px] bg-white"
                  style={{ width: `${avgCompliance}%` }}
                  data-progress-bar={String(avgCompliance)}
                />
              </div>
            )}
          </StatCard>

          <StatCard label={t("totalVulnerabilities")} from="#DC2626" to="#E11D48">
            <p
              className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white"
              data-counter={String(totalVulnerabilities)}
            >
              {totalVulnerabilities}
            </p>
            {(criticalCount > 0 || highCount > 0) && (
              <div className="mt-2 flex gap-1.5">
                {criticalCount > 0 && (
                  <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {criticalCount} {t("critical")}
                  </span>
                )}
                {highCount > 0 && (
                  <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {highCount} {t("high")}
                  </span>
                )}
              </div>
            )}
          </StatCard>

          <StatCard
            label={nextDeadline?.name ?? t("upcomingDeadline")}
            from="#D97706"
            to="#EA580C"
            className="col-span-2 lg:col-span-1"
          >
            {nextDeadline ? (
              <>
                <p
                  className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white"
                  data-counter={t("daysLeft", {
                    days: getDaysUntil(nextDeadline.date),
                  })}
                >
                  {t("daysLeft", { days: getDaysUntil(nextDeadline.date) })}
                </p>
                <p className="mt-1 text-[10px] text-white/65">
                  {nextDeadline.dateLabel}
                </p>
              </>
            ) : (
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                {"\u2014"}
              </p>
            )}
          </StatCard>
        </div>

        {/* ── Action Needed Banner ── */}
        {atRiskProduct && nextDeadline && (
          <div data-reveal>
            <ActionNeededBanner
              product={atRiskProduct}
              deadlineName={nextDeadline.name}
              daysLeft={getDaysUntil(nextDeadline.date)}
              t={t}
            />
          </div>
        )}

        {/* ── Two-column: Product Table + Deadlines sidebar ── */}
        {totalProducts > 0 && (
          <div
            data-reveal
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Product Compliance Table — 2/3 */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <span className="text-sm font-semibold">
                  {t("productTable.title")}
                </span>
                <Link
                  href="/app/products"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("viewAll")}
                </Link>
              </div>

              <div className="flex items-center border-b border-white/[0.06] px-5 py-2.5">
                <span className="flex-1 text-[11px] text-muted-foreground/60">
                  {t("productTable.name")}
                </span>
                <span className="hidden w-32 text-[11px] text-muted-foreground/60 sm:block">
                  {t("productTable.category")}
                </span>
                <span className="hidden w-44 text-[11px] text-muted-foreground/60 md:block">
                  {t("productTable.compliance")}
                </span>
                <span className="hidden w-20 text-[11px] text-muted-foreground/60 lg:block">
                  {t("productTable.sbom")}
                </span>
                <div className="w-6" />
              </div>

              <div className="divide-y divide-white/[0.04]">
                {products.slice(0, 5).map((p) => {
                  const catKey = p.cra_category ?? "default";
                  return (
                    <Link
                      key={p.id}
                      href={`/app/products/${p.id}`}
                      className="group flex items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                          {p.name}
                        </p>
                        {p.type && (
                          <p className="mt-0.5 text-[11px] capitalize text-muted-foreground/50">
                            {t(`productType.${p.type}`)}
                          </p>
                        )}
                      </div>

                      <div className="hidden w-32 sm:block">
                        {p.cra_category ? (
                          <span
                            className={cn(
                              "inline-flex w-24 justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white",
                              CATEGORY_PILL[catKey] ?? CATEGORY_PILL.default,
                            )}
                          >
                            {t(CATEGORY_KEY_MAP[catKey] ?? "categoryDefault")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/30">
                            {t("notAssessed")}
                          </span>
                        )}
                      </div>

                      <div className="hidden w-44 items-center gap-2.5 md:flex">
                        <div className="h-3 w-24 overflow-hidden rounded-[3px] bg-[#191919]">
                          <div
                            className="h-full rounded-[3px]"
                            style={{
                              width: `${p.compliance_score}%`,
                              backgroundColor: scoreColor(p.compliance_score),
                            }}
                            data-progress-bar={String(p.compliance_score)}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color: scoreColor(p.compliance_score) }}
                        >
                          {p.compliance_score}%
                        </span>
                      </div>

                      <div className="hidden w-20 lg:block">
                        {p.has_sbom ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#16A34A]">
                            <span className="size-1.5 rounded-full bg-[#16A34A]" />
                            {t("sbomUploaded")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/30">
                            {t("sbomMissing")}
                          </span>
                        )}
                      </div>

                      <div className="flex w-6 justify-end">
                        <HugeIcon
                          name="arrow-right-01-stroke-rounded"
                          size={16}
                          className="text-muted-foreground/20 transition-colors group-hover:text-muted-foreground"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* CRA Deadlines — 1/3 */}
            <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">{t("deadlines")}</h2>
              <div className="space-y-4">
                {deadlines.map((dl) => {
                  const days = getDaysUntil(dl.date);
                  const isPast = days <= 0;
                  const isUrgent = !isPast && days < 90;
                  return (
                    <div key={dl.date} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isPast ? (
                          <HugeIcon
                            name="checkmark-circle-01-stroke-rounded"
                            size={16}
                            className="text-[#16A34A]"
                          />
                        ) : isUrgent ? (
                          <HugeIcon
                            name="circle-arrow-right-double-stroke-rounded"
                            size={16}
                            className="text-[#D97706]"
                          />
                        ) : (
                          <HugeIcon
                            name="circle-stroke-rounded"
                            size={16}
                            className="text-muted-foreground/40"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{dl.name}</p>
                        <p className="text-[11px] text-muted-foreground/50">
                          {dl.dateLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-semibold tabular-nums",
                          isPast
                            ? "text-[#16A34A]"
                            : isUrgent
                              ? "text-[#D97706]"
                              : "text-muted-foreground/50",
                        )}
                      >
                        {isPast ? t("passed") : t("daysRemaining", { days })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Vuln Breakdown (½) + Vuln Aging (½) ── */}
        {totalProducts > 0 && (
          <div
            data-reveal
            className="grid gap-6 lg:grid-cols-2"
          >
            <VulnBreakdownCard
              critical={criticalCount}
              high={highCount}
              medium={mediumCount}
              low={lowCount}
              t={t}
            />
            <VulnAgingChart
              buckets={stats.vulnAging}
              mttr={stats.mttr}
              openCount={stats.openVulnCount}
            />
          </div>
        )}

        {/* ── Team Activity (full width — line chart wants the space) ── */}
        {totalProducts > 0 && (
          <div data-reveal>
            <ActivityVelocityChart data={stats.activityVelocity} />
          </div>
        )}

        {/* ── Checklist Progress (full width) ── */}
        {totalProducts > 0 && (
          <div data-reveal>
            <ChecklistProgressChart data={stats.checklistProgress} />
          </div>
        )}

        {/* ── Compliance Trend (⅔) + Overdue Tasks (⅓) ── */}
        {totalProducts > 0 && (
          <div
            data-reveal
            className="grid items-stretch gap-6 lg:grid-cols-3"
          >
            <ComplianceTrendChart
              data={stats.complianceTrend}
              className="h-full lg:col-span-2"
            />
            <OverdueTasksWidget
              count={stats.overdueCount}
              items={stats.overdueItems}
            />
          </div>
        )}

        {/* ── Recent Activity ── */}
        {totalProducts > 0 && (
          <div
            data-reveal
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
          >
            <div className="border-b border-white/[0.06] px-5 py-3">
              <span className="text-sm font-semibold">
                {t("recentActivity")}
              </span>
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground/50">
                  {t("noActivity")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/30">
                  {t("activityLogEmpty")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentActivity.map((item) => (
                  <ActivityRow key={item.id} item={item} t={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </StaggerReveal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action Needed Banner
// ---------------------------------------------------------------------------

function ActionNeededBanner({
  product,
  deadlineName,
  daysLeft,
  t,
}: {
  product: DashboardProduct;
  deadlineName: string;
  daysLeft: number;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
    >
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-[#F59E0B]" />
            {t("actionNeeded.eyebrow")}
          </div>
          <h2 className="font-heading text-xl font-bold leading-snug text-white md:text-2xl">
            {t("actionNeeded.headline", {
              product: product.name,
              deadline: deadlineName,
            })}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="font-semibold text-white tabular-nums">
                {daysLeft}
              </span>
              {t("actionNeeded.daysLeft")}
            </span>
            <span className="flex items-center gap-1.5 text-white/70">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: scoreColor(product.compliance_score) }}
              />
              <span
                className="font-semibold tabular-nums"
                style={{ color: scoreColor(product.compliance_score) }}
              >
                {product.compliance_score}%
              </span>
              {t("actionNeeded.compliance")}
            </span>
          </div>
        </div>

        <Link
          href={`/app/products/${product.id}/checklist`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {t("actionNeeded.cta")}
          <HugeIcon name="arrow-right-01-stroke-rounded" size={16} />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  from,
  to,
  className,
  children,
}: {
  label: string;
  from: string;
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="p-5">
        <p className="text-[11px] font-semibold text-white/75">{label}</p>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vulnerability Breakdown Card — full-width, donut + ranked severity list
// ---------------------------------------------------------------------------

function VulnBreakdownCard({
  critical,
  high,
  medium,
  low,
  t,
}: {
  critical: number;
  high: number;
  medium: number;
  low: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const total = critical + high + medium + low;

  const data = [
    { name: t("critical"), value: critical, key: "critical" },
    { name: t("high"), value: high, key: "high" },
    { name: t("medium"), value: medium, key: "medium" },
    { name: t("low"), value: low, key: "low" },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
        <h2 className="mb-2 text-sm font-semibold">{t("vulnChart")}</h2>
        <p className="text-xs text-muted-foreground/60">
          {t("vulnChartSubtitle")}
        </p>
        <p className="mt-10 text-center text-xs text-muted-foreground/50">
          {t("noVulnerabilities")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold">{t("vulnChart")}</h2>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {t("vulnChartSubtitle")}
        </p>
      </div>

      {/* Hero — big total + single distribution bar */}
      <div className="mb-6 flex items-center gap-5">
        <div className="shrink-0">
          <span
            className="block text-4xl font-bold tabular-nums leading-none text-foreground"
            data-counter={String(total)}
          >
            {total}
          </span>
          <span className="mt-1.5 block text-[11px] uppercase tracking-wide text-muted-foreground/70">
            {t("vulnerabilities")}
          </span>
        </div>
        <div className="flex h-5 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-[#191919]">
          {data.map((entry) => {
            const pct = total > 0 ? (entry.value / total) * 100 : 0;
            const color = SEVERITY_CHART_COLORS[entry.key];
            return (
              <div
                key={entry.key}
                className="h-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
                data-progress-bar={String(pct)}
                title={`${entry.name}: ${entry.value} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Severity ranking — each row is a labelled bar */}
      <div className="space-y-3">
        {data.map((entry) => {
          const pct = total > 0 ? (entry.value / total) * 100 : 0;
          const color = SEVERITY_CHART_COLORS[entry.key];
          return (
            <div key={entry.key}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {entry.name}
                </span>
                <span className="ml-auto text-sm font-bold tabular-nums text-foreground">
                  {entry.value}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground/60">
                  ({Math.round(pct)}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-[3px] bg-[#191919]">
                <div
                  className="h-full rounded-[3px]"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  data-progress-bar={String(pct)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Row
// ---------------------------------------------------------------------------

function ActivityRow({
  item,
  t,
}: {
  item: ActivityItem;
  t: ReturnType<typeof useTranslations>;
}) {
  const initials = item.user_name
    ? item.user_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : item.product_name.charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-3.5 px-5 py-3.5">
      {item.user_avatar_url ? (
        <img
          src={item.user_avatar_url}
          alt={item.user_name ?? ""}
          className="mt-0.5 size-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-muted-foreground">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{item.user_name ?? "System"}</span>{" "}
          <span className="text-muted-foreground">
            {t(`activity.${item.type}`, { product: "" }).trim()}
          </span>{" "}
          <span className="font-medium">{item.product_name}</span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
              ACTIVITY_TYPE_PILL[item.type] ?? "bg-white/[0.12]",
            )}
          >
            {t(`activityType.${item.type}`)}
          </span>
          <span className="text-[11px] text-muted-foreground/40">
            {relativeTime(item.created_at, t)}
          </span>
        </div>
      </div>
    </div>
  );
}
