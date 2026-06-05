"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * ProjectStatisticsCard — "Project Statistics" weekly activity chart, styled
 * after Figma frame `28:1755` / `142:15583` (id `28:2183`).
 *
 * Each weekday renders one bar whose height encodes that day's *real* activity
 * count (events logged to `public.activities`), normalised to the busiest day
 * in the window. Earlier versions rendered a second fabricated bar
 * (`count * 0.55`) as a fake "comparison baseline"; that made a brand-new,
 * empty organisation show phantom data, so the second series was removed and an
 * explicit empty state was added.
 *
 * Geometry:
 *   container `bg-card rounded-md shadow-card-lg p-[18px]`, min-h 346
 *   y-axis ticks 0/20/40/60/80/100, 6 gridlines
 *   x-axis Monday..Sunday
 *   bars: 24px wide, rounded top, primary-blue gradient
 */

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export interface DayActivity {
  /** Weekday key for the X axis. */
  day: (typeof DAYS)[number];
  /** Raw activity count for that day (>= 0). */
  count: number;
}

const Y_TICKS = [100, 80, 60, 40, 20, 0];

interface Props {
  /** Exactly 7 values, Mon → Sun. Missing days fall through to 0. */
  data?: DayActivity[];
  title?: string;
  legendLabel?: string;
}

export function ProjectStatisticsCard({ data, title, legendLabel }: Props) {
  const t = useTranslations("dashboard");
  const [filter] = useState("week");

  const days = useMemo(() => data ?? [], [data]);
  const maxCount = useMemo(
    () => Math.max(0, ...days.map((d) => d.count)),
    [days],
  );
  const hasActivity = maxCount > 0;

  const dayMap = useMemo(() => {
    const m = new Map<string, number>();
    days.forEach((d) => m.set(d.day, d.count));
    return m;
  }, [days]);

  const resolvedTitle =
    title ??
    (t.has("statistics.title") ? t("statistics.title") : "Project Statistics");
  const resolvedLegend =
    legendLabel ??
    (t.has("statistics.activity") ? t("statistics.activity") : "Activity");
  const timeWindow =
    filter === "week"
      ? t.has("statistics.weekFilter")
        ? t("statistics.weekFilter")
        : "This week"
      : filter;

  return (
    <div className="flex min-h-[346px] w-full flex-col rounded-md bg-card p-[18px] shadow-card-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-h4 text-foreground">{resolvedTitle}</p>
        <div className="flex items-center gap-2">
          <FilterChip>
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-primary"
            />
            {resolvedLegend}
          </FilterChip>
          <FilterChip>
            {timeWindow}
            <Icon name="ArrowDown2" size={14} className="text-muted-foreground" />
          </FilterChip>
        </div>
      </div>

      {hasActivity ? (
        <>
          {/* Chart */}
          <div className="relative mt-6 flex flex-1 gap-3">
            {/* Y-axis */}
            <div className="flex w-9 flex-col justify-between pr-2 text-p3 text-muted-foreground">
              {Y_TICKS.map((tick) => (
                <span key={tick} className="leading-none">
                  {tick}
                </span>
              ))}
            </div>

            {/* Plot area */}
            <div className="relative flex-1">
              {/* Horizontal gridlines */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              >
                {Y_TICKS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-px w-full",
                      i === Y_TICKS.length - 1
                        ? "bg-border-outline"
                        : "bg-border-strong",
                    )}
                  />
                ))}
              </div>

              {/* Bars — one per weekday, real activity count */}
              <div className="relative flex h-full items-end justify-between pb-1">
                {DAYS.map((day) => {
                  const count = dayMap.get(day) ?? 0;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div
                      key={day}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <Bar value={pct} count={count} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex pl-9">
            {DAYS.map((day) => (
              <div
                key={day}
                className="flex-1 text-center text-p3 text-muted-foreground"
              >
                {t.has(`statistics.day.${day}`)
                  ? t(`statistics.day.${day}`)
                  : day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyChart
          message={
            t.has("statistics.empty")
              ? t("statistics.empty")
              : "No activity yet this week. As you and your team work through products, SBOMs and checklists, your weekly activity will show up here."
          }
        />
      )}
    </div>
  );
}

function Bar({ value, count }: { value: number; count: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative w-6 overflow-hidden rounded-tl-md rounded-tr-md bg-[linear-gradient(180deg,#066DE6_0%,#6DA9F0_120%)] transition-all"
      style={{ height: `${clamped}%`, minHeight: clamped > 0 ? 4 : 0 }}
      aria-label={`${count}`}
    />
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-outline bg-muted/40 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="Chart" size={22} />
      </span>
      <p className="max-w-xs text-p3 text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Filter chip — Figma spec: `bg-card border-[1.5px] border-border-outline
 * rounded-sm px-2.5 py-1.5 gap-3.5 text-p3` with an optional chevron.
 */
function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-3.5 rounded-sm border-[1.5px] border-border-outline bg-card px-2.5 py-1.5 text-p3 text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}
