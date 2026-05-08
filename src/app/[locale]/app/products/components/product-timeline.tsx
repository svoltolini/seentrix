"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductTimeline — CRA Compliance Roadmap.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  ◉ Today          ◉ Notified Bodies      ◉ Reporting     ◉ Full   │
 *   │  May 8 2026         Jun 11 2026          Sep 11 2026     Dec '27  │
 *   │  ─                  ── 1 mo away ──       ── 4 mo away ──         │
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │  ┌──┐  Product A                       │            │             │
 *   │  │A │  Software · 73 % compliant       │            │             │
 *   │  └──┘  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱│▱▱▱▱▱▱▱▱▱▱▱│▱▱▱▱▱▱▱▱▱▱▱▱  │
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │  ┌──┐  Product B                       │            │             │
 *   │  │B │  Hardware · 45 % compliant       │            │             │
 *   │  └──┘  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱│▱▱▱▱▱▱▱▱▱▱▱│▱▱▱▱▱▱▱▱▱▱▱▱  │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Replaces an earlier Gantt-style swimlane view (it never quite worked
 * for Seentrix because products have no per-product deadline — only
 * the universal CRA milestones do). The redesign is built around the
 * actual mental model the user lives with day-to-day:
 *
 *   "How is each product tracking against the three CRA dates?"
 *
 *   - Top header: a horizontal rail with four points — Today, Notified
 *     Bodies (Jun 11 2026), Reporting Obligations (Sep 11 2026), Full
 *     Compliance (Dec 11 2027). Each point is a labelled marker; the
 *     copy under each one shows "in N months/days" so the regulatory
 *     pressure is visible at a glance.
 *
 *   - Body: each product gets a row card with its compliance progress
 *     bar. The three CRA milestones cast vertical accent lines that
 *     cut through every product's bar, so a single visual scan tells
 *     you "is this product past the Notified Bodies threshold yet?"
 *     The thresholds are calibrated to "where you should be by that
 *     milestone": 33 % by Notified Bodies, 66 % by Reporting, 100 %
 *     by Full Compliance.
 *
 * Why not pin to absolute time? The progress bar is conceptually a
 * percentage of work done, not a percentage of the calendar. The
 * milestone markers translate calendar dates into "expected progress
 * by that date" — so the visual remains a progress bar (familiar)
 * with regulatory checkpoints overlaid (informative).
 */

// CRA regulatory milestones — the universal Seentrix timeline. Update
// the dates here if the regulation shifts; the component re-derives
// "days until" automatically.
const CRA_MILESTONES = [
  {
    key: "notifiedBodies",
    date: "2026-06-11",
    /** Expected compliance % by this date — drives the marker x-position. */
    expectedPct: 33,
  },
  {
    key: "reporting",
    date: "2026-09-11",
    expectedPct: 66,
  },
  {
    key: "fullCompliance",
    date: "2027-12-11",
    expectedPct: 100,
  },
] as const;

const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  hardware: { bg: "bg-primary/10", fg: "text-primary" },
  software: { bg: "bg-accent/10", fg: "text-accent" },
  firmware: { bg: "bg-success/10", fg: "text-success" },
  iot: { bg: "bg-warning/10", fg: "text-warning" },
};

function laneFillFor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 40) return "bg-accent";
  return "bg-destructive";
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function humanDistance(daysFromNow: number, t: ReturnType<typeof useTranslations>): string {
  if (daysFromNow < 0) return t.has("timeline.passed") ? t("timeline.passed") : "Passed";
  if (daysFromNow === 0) return t.has("timeline.today") ? t("timeline.today") : "Today";
  if (daysFromNow < 30)
    return t.has("timeline.daysAway")
      ? t("timeline.daysAway", { days: daysFromNow })
      : `${daysFromNow} days away`;
  const months = Math.round(daysFromNow / 30);
  return t.has("timeline.monthsAway")
    ? t("timeline.monthsAway", { months })
    : `${months} months away`;
}

interface Props {
  products: ProductListItem[];
  basePath?: string;
}

export function ProductTimeline({
  products,
  basePath = "/app/products",
}: Props) {
  const t = useTranslations("products");

  const milestones = useMemo(() => {
    const today = new Date();
    return CRA_MILESTONES.map((m) => {
      const date = new Date(m.date);
      return {
        ...m,
        date,
        daysAway: daysBetween(today, date),
        label: t.has(`timeline.milestones.${m.key}`)
          ? t(`timeline.milestones.${m.key}`)
          : m.key,
      };
    });
  }, [t]);

  return (
    <div className="flex flex-col gap-6">
      {/* === HEADER ROADMAP =================================== */}
      <div className="rounded-md bg-card p-6 shadow-card-md">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t.has("timeline.eyebrow") ? t("timeline.eyebrow") : "CRA Roadmap"}
          </p>
          <p className="text-p4 text-muted-foreground">
            {t.has("timeline.legend")
              ? t("timeline.legend")
              : "Vertical lines mark the compliance threshold expected by each milestone."}
          </p>
        </div>

        {/* Roadmap rail — one Today marker on the far left, then the
            three CRA milestones at their proportional positions. */}
        <div className="relative">
          {/* The connecting line itself, sitting behind the markers */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[14px] h-px bg-border"
          />

          <ol className="relative grid grid-cols-4 gap-4">
            <li>
              <RoadmapMarker
                tone="today"
                label={
                  t.has("timeline.now") ? t("timeline.now") : "Today"
                }
                dateLabel={new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                meta={t.has("timeline.start") ? t("timeline.start") : "Start"}
              />
            </li>
            {milestones.map((m) => (
              <li key={m.key}>
                <RoadmapMarker
                  tone={m.daysAway < 0 ? "passed" : "future"}
                  label={m.label}
                  dateLabel={m.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  meta={humanDistance(m.daysAway, t)}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* === PRODUCT ROWS ===================================== */}
      <ul className="flex flex-col gap-3">
        {products.map((p) => {
          const tone = TYPE_TONE[p.type ?? ""] ?? {
            bg: "bg-muted",
            fg: "text-foreground",
          };
          const subtitle = p.type
            ? t.has(`types.${p.type}`)
              ? t(`types.${p.type}`)
              : p.type
            : "Product";
          const score = p.compliance_score;
          const fillWidth = Math.max(0, Math.min(100, score));

          return (
            <li key={p.id}>
              <Link
                href={`${basePath}/${p.id}`}
                className="group/timeline-row flex flex-col gap-4 rounded-md bg-card p-5 shadow-card-sm transition-shadow hover:shadow-card-md sm:flex-row sm:items-center"
              >
                {/* Left: type-tinted icon + title block */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-md text-h5",
                      tone.bg,
                      tone.fg,
                    )}
                  >
                    {p.name[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-h5 text-foreground transition-colors group-hover/timeline-row:text-primary">
                      {p.name}
                    </p>
                    <p className="truncate text-p4 text-muted-foreground">
                      {subtitle} ·{" "}
                      <span className="text-foreground">
                        {score}%{" "}
                        {t.has("timeline.compliant")
                          ? t("timeline.compliant")
                          : "compliant"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right: progress bar with milestone markers cutting
                    through it. The bar takes the full remaining width
                    so the markers align consistently down the page. */}
                <div className="relative w-full sm:max-w-[640px]">
                  <ProgressBarWithMilestones
                    fillPct={fillWidth}
                    fillClass={laneFillFor(score)}
                    milestones={milestones}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// === Roadmap marker (header) ============================================

function RoadmapMarker({
  tone,
  label,
  dateLabel,
  meta,
}: {
  tone: "today" | "future" | "passed";
  label: string;
  dateLabel: string;
  meta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {/* Dot — primary for today, accent for future, muted for passed.
          The drop shadow lifts it off the connecting line behind. */}
      <span
        className={cn(
          "relative z-10 size-[22px] rounded-full border-[3px] bg-card",
          tone === "today"
            ? "border-primary"
            : tone === "future"
              ? "border-accent"
              : "border-muted-foreground/40",
        )}
      />
      <p className="text-h6 text-foreground">{label}</p>
      <p className="text-p4 text-muted-foreground">{dateLabel}</p>
      <span
        className={cn(
          "rounded-sm px-2 py-0.5 text-l6-plus uppercase tracking-wider",
          tone === "today"
            ? "bg-primary/10 text-primary"
            : tone === "future"
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground",
        )}
      >
        {meta}
      </span>
    </div>
  );
}

// === Progress bar with milestone markers (row) ==========================

function ProgressBarWithMilestones({
  fillPct,
  fillClass,
  milestones,
}: {
  fillPct: number;
  fillClass: string;
  milestones: { key: string; expectedPct: number }[];
}) {
  return (
    <div className="relative">
      {/* Track + fill. Track is intentionally taller than the standard
          1.5 px progress recipe so the milestone markers have visual
          surface to sit on. */}
      <div className="relative h-2 overflow-hidden rounded-xl bg-border">
        <div
          className={cn("h-full rounded-xl transition-[width] duration-300", fillClass)}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Milestone vertical markers, painted on top of the track. */}
      {milestones.map((m) => (
        <div
          key={m.key}
          aria-hidden
          className={cn(
            "absolute -top-1 h-4 w-px",
            // Markers turn primary once the user has hit them, muted
            // until then. Quick green-flag affordance per row.
            fillPct >= m.expectedPct
              ? "bg-success"
              : "bg-muted-foreground/40",
          )}
          style={{ left: `${m.expectedPct}%` }}
        />
      ))}
    </div>
  );
}
