"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
import { SEVERITY_CHART_COLORS } from "../products/[productId]/constants";
import type {
  DashboardStats,
  DashboardProduct,
  ActivityItem,
} from "../products/actions";
import type { IncidentWidgetData } from "../incidents/actions";
import type { SupportWidgetData } from "../products/[productId]/releases/actions";
import type { CompanyProfileStatus } from "../settings/actions";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";
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


// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardContent(
  stats: DashboardStats & {
    incidentWidget?: IncidentWidgetData;
    supportWidget?: SupportWidgetData;
    profileStatus?: CompanyProfileStatus;
  },
) {
  const t = useTranslations("dashboard");
  const tInc = useTranslations("incidents");
  const tRel = useTranslations("releases");
  const tOrg = useTranslations("settings.organization");
  const tActivity = useTranslations("settings.activity");
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

  // --- Dashboard-wide animations ---
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
          duration: 1.4,
          ease: "power3.out",
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

      // Progress bars grow from 0% to target%.
      // immediateRender: false keeps the "from" state from being applied on
      // mount — so if the scroll trigger never fires (e.g. the element is
      // inside a parent with transformed/opacity-0 state mid-reveal), the
      // bar still displays at its target width from its inline style.
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
              duration: 1.3,
              ease: "power3.out",
              immediateRender: false,
              scrollTrigger: {
                trigger: bar,
                start: "top 95%",
                once: true,
              },
            },
          );
        },
      );

      // Shimmer sweep — a subtle highlight passes across marked elements
      // every few seconds. Adds life to gradient bars without distracting.
      el.querySelectorAll<HTMLElement>("[data-shimmer]").forEach((shimmer) => {
        gsap.fromTo(
          shimmer,
          { xPercent: -100 },
          {
            xPercent: 400,
            duration: 2.8,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 3,
            delay: 1.5,
          },
        );
      });

      // Pulse — the Action Needed dot breathes to draw the eye
      el.querySelectorAll<HTMLElement>("[data-pulse]").forEach((dot) => {
        gsap.to(dot, {
          scale: 1.4,
          opacity: 0.6,
          duration: 1.1,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mx-auto max-w-[1120px] pb-12">
      <StaggerReveal
        className="space-y-8"
        selector="[data-reveal]"
        stagger={0.09}
        y={28}
        duration={0.8}
        scale={0.98}
        ease="power3.out"
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

        {/* ── Company profile completeness — blocks DoC issuance ── */}
        {stats.profileStatus && !stats.profileStatus.complete && (
          <div data-reveal>
            <ProfileIncompleteBanner
              eyebrow={tOrg("docReady.eyebrow")}
              title={tOrg("docReady.title")}
              description={tOrg("docReady.description", {
                count: stats.profileStatus.missing.length,
              })}
              cta={tOrg("docReady.cta")}
            />
          </div>
        )}

        {/* ── Active Incidents Banner — Article 14 countdown ── */}
        {stats.incidentWidget && stats.incidentWidget.activeCount > 0 && (
          <div data-reveal>
            <ActiveIncidentsBanner
              data={stats.incidentWidget}
              tInc={tInc}
            />
          </div>
        )}

        {/* ── Support period watch — Annex I Part II "N years of updates" ── */}
        {stats.supportWidget &&
          (stats.supportWidget.expiringWithin90 > 0 ||
            stats.supportWidget.outOfSupport > 0) && (
            <div data-reveal>
              <SupportWatchStrip
                data={stats.supportWidget}
                tRel={tRel}
              />
            </div>
          )}

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
            {/* Eyebrow + heading pattern (demo from the MFA screen). If you
                like this rhythm on the dashboard, the same three-line shape
                applies to every other card header — eyebrow signals the
                category, heading is the label, subtext is the one-liner. */}
            <div className="border-b border-white/[0.06] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
                {t("activityEyebrow")}
              </p>
              <h2 className="mt-1 font-heading text-base font-bold text-foreground">
                {t("recentActivity")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                {t("activitySubtitle")}
              </p>
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
                  <ActivityRow
                    key={item.id}
                    item={item}
                    tSettings={tActivity}
                    tDashboard={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </StaggerReveal>
    </div>
  );
}

function SupportWatchStrip({
  data,
  tRel,
}: {
  data: SupportWidgetData;
  tRel: ReturnType<typeof useTranslations>;
}) {
  const tiles = [
    {
      key: "expiringSoon",
      label: tRel("dashboard.expiringSoon"),
      value: data.expiringWithin90,
      accent: "#D97706",
      show: data.expiringWithin90 > 0,
    },
    {
      key: "outOfSupport",
      label: tRel("dashboard.outOfSupport"),
      value: data.outOfSupport,
      accent: "#DC2626",
      show: data.outOfSupport > 0,
    },
    {
      key: "missing",
      label: tRel("dashboard.missing"),
      value: data.missingSupportDates,
      accent: "#6B7280",
      show: data.missingSupportDates > 0,
    },
  ].filter((t) => t.show);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
      <div className="flex items-center gap-2">
        <HugeIcon
          name="time-quarter-02-stroke-rounded"
          size={16}
          className="text-muted-foreground"
        />
        <p className="text-xs font-semibold text-foreground">
          {tRel("dashboard.title")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <span
            key={tile.key}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: `${tile.accent}4D`,
              backgroundColor: `${tile.accent}1A`,
              color: tile.accent,
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: tile.accent }}
            />
            {tile.value} · {tile.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActiveIncidentsBanner({
  data,
  tInc,
}: {
  data: IncidentWidgetData;
  tInc: ReturnType<typeof useTranslations>;
}) {
  // Keep the countdown fresh without calling Date.now() inline during
  // render (the React purity rules forbid that). We seed from a lazy
  // initializer and tick each minute inside an effect.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const deadline = data.nextDeadlineAt
    ? new Date(data.nextDeadlineAt)
    : null;
  const overdue = deadline ? deadline.getTime() < now : false;
  const remainingMs = deadline ? deadline.getTime() - now : 0;
  const absH = Math.floor(Math.abs(remainingMs) / 3600_000);
  const absD = Math.floor(absH / 24);
  const timeText = absD >= 1 ? `${absD}d ${absH % 24}h` : `${absH}h`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[#DC2626]/40"
      style={{
        background:
          "linear-gradient(135deg, rgba(220,38,38,0.25), rgba(217,119,6,0.15))",
      }}
    >
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/25">
            <span
              data-pulse
              className="flex size-6 items-center justify-center rounded-full bg-[#DC2626]"
            >
              <HugeIcon name="alert-02" size={14} className="text-white" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#DC2626]">
              {tInc("kpi.active")}
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold leading-snug text-foreground md:text-xl">
              {tInc("banner.headline", { count: data.activeCount })}
            </h2>
            {deadline && data.nextDeadlinePhase && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {overdue
                  ? tInc("deadline.overdueBy", { time: timeText })
                  : tInc("deadline.in", { time: timeText })}
                <span className="ml-1.5 text-[12px]">
                  · {tInc(`phase.${data.nextDeadlinePhase}`)}
                </span>
              </p>
            )}
          </div>
        </div>
        <Link
          href={
            data.nextIncidentId
              ? `/app/incidents/${data.nextIncidentId}`
              : "/app/incidents"
          }
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {tInc("breadcrumb")}
          <HugeIcon name="arrow-right-01-stroke-rounded" size={16} />
        </Link>
      </div>
    </div>
  );
}

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
            <span
              data-pulse
              className="size-1.5 rounded-full bg-[#F59E0B]"
            />
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
      <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-card p-6">
        <h2 className="mb-2 text-sm font-semibold">{t("vulnChart")}</h2>
        <p className="text-xs text-muted-foreground/60">
          {t("vulnChartSubtitle")}
        </p>
        <p className="mt-10 flex-1 text-center text-xs text-muted-foreground/50">
          {t("noVulnerabilities")}
        </p>
      </div>
    );
  }

  // Build a smooth CSS gradient that reflects each severity's share by
  // placing color stops at the segment midpoints. The browser interpolates
  // between stops, so neighbouring colors blend smoothly instead of the
  // hard edges a segmented bar would show.
  const gradientStops: { color: string; midpoint: number }[] = [];
  let cumulative = 0;
  for (const entry of data) {
    const segWidth = (entry.value / total) * 100;
    const midpoint = cumulative + segWidth / 2;
    gradientStops.push({
      color: SEVERITY_CHART_COLORS[entry.key],
      midpoint,
    });
    cumulative += segWidth;
  }
  const gradient =
    gradientStops.length === 1
      ? gradientStops[0].color
      : `linear-gradient(to right, ${gradientStops
          .map((s) => `${s.color} ${s.midpoint.toFixed(2)}%`)
          .join(", ")})`;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold">{t("vulnChart")}</h2>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {t("vulnChartSubtitle")}
        </p>
      </div>

      {/* Hero — big total on top, full-width gradient distribution bar below */}
      <div className="mb-6">
        <div className="mb-3 flex items-baseline gap-2">
          <span
            className="text-4xl font-bold tabular-nums leading-none text-foreground"
            data-counter={String(total)}
          >
            {total}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            {t("vulnerabilities")}
          </span>
        </div>
        <div className="relative h-6 w-full overflow-hidden rounded-[4px] bg-[#191919]">
          {/* The gradient fill is always at 100% width — the "hero" bar
              doesn't need the grow-in animation; the shimmer sweep plus
              the cascade reveal on the parent card is enough movement. */}
          <div
            className="h-full rounded-[4px]"
            style={{ width: "100%", backgroundImage: gradient }}
            title={data
              .map(
                (e) =>
                  `${e.name}: ${e.value} (${Math.round(
                    (e.value / total) * 100,
                  )}%)`,
              )
              .join(" · ")}
          />
          {/* Shimmer sweep — a soft highlight animated via GSAP */}
          <div
            data-shimmer
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
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

// Top-level action namespace → activity-pill colour. Same palette that
// lights up Settings → Activity so colours read consistently across both
// views.
const ACTIVITY_ACTION_PILL: Record<string, string> = {
  organization: "bg-[#2563EB]",
  member: "bg-[#2563EB]",
  profile: "bg-[#2563EB]",
  password: "bg-[#2563EB]",
  product: "bg-[#7C3AED]",
  document: "bg-[#16A34A]",
  sbom: "bg-[#D97706]",
  checklist: "bg-[#2563EB]",
  vulnerability: "bg-[#DC2626]",
  vulnerability_report: "bg-[#DC2626]",
  incident: "bg-[#DC2626]",
  release: "bg-[#0891B2]",
  conformity: "bg-[#16A34A]",
  entity_obligation: "bg-[#0891B2]",
  billing: "bg-[#7C3AED]",
  academy: "bg-[#F59E0B]",
};

function ActivityRow({
  item,
  tSettings,
  tDashboard,
}: {
  item: ActivityItem;
  tSettings: ReturnType<typeof useTranslations>;
  tDashboard: ReturnType<typeof useTranslations>;
}) {
  const initials = item.user_name
    ? item.user_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "·";

  // Translate the action key against the Settings → Activity namespace, so
  // both views use the same human-readable strings.
  const actionKey = `actions.${item.action}` as Parameters<typeof tSettings>[0];
  const actionLabel = tSettings.has(actionKey)
    ? tSettings(actionKey)
    : item.action.replace(/[._]/g, " ");

  const topLevel = item.action.split(".")[0];
  const pillClass = ACTIVITY_ACTION_PILL[topLevel] ?? "bg-white/[0.12]";

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
          <span className="text-muted-foreground">{actionLabel}</span>
          {item.target_name && (
            <>
              {" "}
              <span className="font-medium">{item.target_name}</span>
            </>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
              pillClass,
            )}
          >
            {(() => {
              const spaced = topLevel.replace(/_/g, " ");
              return spaced.charAt(0).toUpperCase() + spaced.slice(1);
            })()}
          </span>
          <span className="text-[11px] text-muted-foreground/40">
            {relativeTime(item.created_at, tDashboard)}
          </span>
        </div>
      </div>
    </div>
  );
}
