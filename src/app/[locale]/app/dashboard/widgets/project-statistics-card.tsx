"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * ProjectStatisticsCard — verbatim 1:1 of the "Project Statistics" card from
 * Figma frame `28:1755` / `142:15583` (id `28:2183`).
 *
 * Geometry:
 *   container 696×346, `bg-card rounded-[10px] shadow-card-lg`
 *   header at top:18: title 18/700 + filter-chip cluster on the right
 *   y-axis labels: 0/20/40/60/80/100, 14/500 muted, gridlines 6 × 1px
 *   x-axis days: Monday..Sunday at top:312, label 14/500 muted
 *   bars: 24px wide, rounded-tl/tr-[6px], 2 bars per day (paired)
 *     bar A (Rectangle 9561) — primary blue gradient
 *     bar B (Rectangle 9568) — accent orange (solid)
 *
 * Props:
 *   data — 7 entries (one per weekday) with two values each (`a` and `b`)
 *   primaryLabel / secondaryLabel — drive the legend chips on the header
 */

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

interface DayData {
  /** Label for the X axis. */
  day: (typeof DAYS)[number];
  /** Primary bar value (0-100). */
  a: number;
  /** Secondary bar value (0-100). */
  b: number;
}

const Y_TICKS = [100, 80, 60, 40, 20, 0];

interface Props {
  /** Exactly 7 values, Mon → Sun. Missing days fall through to 0. */
  data?: DayData[];
  primaryLabel?: string;
  secondaryLabel?: string;
  title?: string;
  filterOptions?: { key: string; label: string }[];
}

export function ProjectStatisticsCard({
  data,
  primaryLabel,
  secondaryLabel,
  title,
  filterOptions,
}: Props) {
  const t = useTranslations("dashboard");
  const [filter, setFilter] = useState(filterOptions?.[0]?.key ?? "completed");

  const dayMap = useMemo(() => {
    const m = new Map<string, DayData>();
    (data ?? []).forEach((d) => m.set(d.day, d));
    return m;
  }, [data]);

  const resolvedTitle = title ?? (t.has("statistics.title") ? t("statistics.title") : "Project Statistics");
  const labelPrimary = primaryLabel ?? (t.has("statistics.primary") ? t("statistics.primary") : "Task Completed");
  const labelSecondary = secondaryLabel ?? (t.has("statistics.secondary") ? t("statistics.secondary") : "Task Created");
  const timeWindow = filterOptions?.find((o) => o.key === filter)?.label ??
    (t.has("statistics.weekFilter") ? t("statistics.weekFilter") : "Week");

  return (
    <div className="flex h-[346px] w-full flex-col rounded-md bg-card p-[18px] shadow-card-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-h4 text-foreground">{resolvedTitle}</p>
        <div className="flex items-center gap-2">
          <FilterChip>
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-primary"
            />
            {labelPrimary}
            <Icon name="ArrowDown2" size={14} className="text-muted-foreground" />
          </FilterChip>
          <FilterChip>
            {timeWindow}
            <Icon name="ArrowDown2" size={14} className="text-muted-foreground" />
          </FilterChip>
        </div>
      </div>

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
          {/* Horizontal gridlines, 6 x equal-spaced */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex flex-col justify-between"
          >
            {Y_TICKS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-px w-full",
                  i === Y_TICKS.length - 1 ? "bg-border-outline" : "bg-border-strong",
                )}
              />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex h-full items-end justify-between pb-1">
            {DAYS.map((day) => {
              const d = dayMap.get(day) ?? { day, a: 0, b: 0 };
              return (
                <div
                  key={day}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div className="flex h-full items-end gap-2">
                    <Bar value={d.a} tone="primary" />
                    <Bar value={d.b} tone="accent" />
                  </div>
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

      {/* Legend (small, bottom-right) */}
      <div className="mt-3 flex items-center justify-end gap-4 text-p4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-primary" />
          {labelPrimary}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-accent" />
          {labelSecondary}
        </span>
      </div>
    </div>
  );
}

function Bar({
  value,
  tone,
}: {
  value: number;
  tone: "primary" | "accent";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative w-6 overflow-hidden rounded-tl-md rounded-tr-md transition-all",
        tone === "primary"
          ? "bg-[linear-gradient(180deg,#066DE6_0%,#6DA9F0_120%)]"
          : "bg-accent",
      )}
      style={{ height: `${clamped}%`, minHeight: clamped > 0 ? 4 : 0 }}
      aria-label={`${tone}: ${clamped}%`}
    />
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-sm border-[1.5px] border-border-outline bg-card px-3 text-p3 text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}
