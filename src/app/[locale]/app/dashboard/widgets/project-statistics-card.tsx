"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { IconBadge } from "@/components/ui/icon-badge";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

/**
 * ProjectStatisticsCard — "Project Statistics" activity chart, styled after
 * Figma frame `28:1755` / `142:15583`.
 *
 * Driven by a dense daily activity series (`points`: one entry per calendar
 * day, keyed by UTC date YYYY-MM-DD). The card buckets that series for the
 * selected timeframe:
 *   - This week:  Mon→Sun of the *current* calendar week. Days in the future
 *                 (e.g. Sunday when today is Saturday) render no bar.
 *   - This month: each day 1→N of the current month; future days empty.
 *   - This year:  Jan→Dec, one bar per month; future months empty.
 *
 * Earlier versions positionally mapped "the last 7 array entries" onto
 * Monday..Sunday by index, so the labels never matched the real weekday —
 * a Saturday could show under "Sunday" and a not-yet-happened day could show
 * activity. Bucketing by the real date of each point fixes that.
 */

export interface DayActivity {
  /** UTC date, YYYY-MM-DD. */
  date: string;
  /** Raw activity count for that date (>= 0). */
  count: number;
}

type Timeframe = "week" | "month" | "year";

const Y_TICKS = [100, 80, 60, 40, 20, 0];

interface Bucket {
  /** X-axis label (e.g. "Mon", "12", "Jan"). */
  label: string;
  /** Aggregated activity count for this bucket. */
  count: number;
  /** True once this bucket's period has started (<= today). Future buckets
   *  render no bar regardless of count (which is 0 anyway). */
  inPast: boolean;
}

interface Props {
  /** Dense daily activity series, ascending by date. */
  points?: DayActivity[];
  title?: string;
  legendLabel?: string;
}

// ---- date helpers (all UTC, to match the server's UTC date keys) ----------

function utcKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Monday-start week index: Mon=0 … Sun=6. */
function mondayIndex(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

export function ProjectStatisticsCard({ points, title, legendLabel }: Props) {
  const t = useTranslations("dashboard");
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  const series = useMemo(() => points ?? [], [points]);

  // Map of date-key → count for O(1) lookups while bucketing.
  const countByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of series) m.set(p.date, (m.get(p.date) ?? 0) + p.count);
    return m;
  }, [series]);

  const weekDayLabels = useMemo(
    () =>
      (["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map(
        (day) =>
          t.has(`statistics.day.${day}`)
            ? t(`statistics.day.${day}`)
            : day.charAt(0).toUpperCase() + day.slice(1, 3),
      ),
    [t],
  );

  const monthLabels = useMemo(
    () =>
      ([
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec",
      ] as const).map((mo) =>
        t.has(`statistics.month.${mo}`)
          ? t(`statistics.month.${mo}`)
          : mo.charAt(0).toUpperCase() + mo.slice(1),
      ),
    [t],
  );

  // ---- Build buckets for the selected timeframe -----------------------------
  const buckets = useMemo<Bucket[]>(() => {
    const now = new Date();
    const todayKey = utcKey(now);

    if (timeframe === "week") {
      // Monday of the current week (UTC).
      const monday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      monday.setUTCDate(monday.getUTCDate() - mondayIndex(now));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        const key = utcKey(d);
        return {
          label: weekDayLabels[i],
          count: countByDate.get(key) ?? 0,
          inPast: key <= todayKey,
        };
      });
    }

    if (timeframe === "month") {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const key = utcKey(new Date(Date.UTC(year, month, day)));
        return {
          // Label every 5th day (1, 5, 10, …) to avoid a cramped axis.
          label: day === 1 || day % 5 === 0 ? String(day) : "",
          count: countByDate.get(key) ?? 0,
          inPast: key <= todayKey,
        };
      });
    }

    // year — 12 monthly buckets.
    const year = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    return Array.from({ length: 12 }, (_, m) => {
      let sum = 0;
      const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        sum += countByDate.get(utcKey(new Date(Date.UTC(year, m, day)))) ?? 0;
      }
      return {
        label: monthLabels[m],
        count: sum,
        inPast: m <= currentMonth,
      };
    });
  }, [timeframe, countByDate, weekDayLabels, monthLabels]);

  const maxCount = useMemo(
    () => Math.max(0, ...buckets.map((b) => b.count)),
    [buckets],
  );
  const hasActivity = maxCount > 0;

  const resolvedTitle =
    title ??
    (t.has("statistics.title") ? t("statistics.title") : "Project Statistics");
  const resolvedLegend =
    legendLabel ??
    (t.has("statistics.activity") ? t("statistics.activity") : "Activity");

  const timeframeLabel = (tf: Timeframe) => {
    const key =
      tf === "week"
        ? "statistics.weekFilter"
        : tf === "month"
          ? "statistics.monthFilter"
          : "statistics.yearFilter";
    const fallback =
      tf === "week" ? "This week" : tf === "month" ? "This month" : "This year";
    return t.has(key) ? t(key) : fallback;
  };

  return (
    <div className="flex min-h-[346px] w-full flex-col rounded-lg border border-border bg-card p-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-h4 text-foreground">{resolvedTitle}</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-3.5 rounded-sm border-[1.5px] border-border-outline bg-card px-2.5 py-1.5 text-p3 text-foreground">
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-primary"
            />
            {resolvedLegend}
          </span>

          {/* Timeframe — Segmented view switcher (design .sx-seg) */}
          <Segmented
            value={timeframe}
            onChange={(v) => setTimeframe(v as Timeframe)}
            options={(["week", "month", "year"] as const).map((tf) => ({
              value: tf,
              label: timeframeLabel(tf),
            }))}
          />
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

              {/* Bars — one per bucket. Future buckets render no bar. */}
              <div
                className={cn(
                  "relative flex h-full items-end pb-1",
                  buckets.length > 14 ? "gap-px" : "justify-between",
                )}
              >
                {buckets.map((b, i) => {
                  const pct = Math.round((b.count / maxCount) * 100);
                  return (
                    <div
                      key={i}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <Bar
                        value={b.inPast ? pct : 0}
                        count={b.count}
                        wide={buckets.length <= 14}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-axis labels — mirror the chart row (w-9 Y-axis + gap-3 + plot)
              so each label sits centered under its bar. */}
          <div className="mt-2 flex gap-3">
            <div className="w-9 shrink-0" aria-hidden />
            <div
              className={cn(
                "flex flex-1",
                buckets.length > 14 ? "gap-px" : "justify-between",
              )}
            >
              {buckets.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-p3 text-muted-foreground"
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyChart
          message={
            t.has(`statistics.empty.${timeframe}`)
              ? t(`statistics.empty.${timeframe}`)
              : t.has("statistics.empty")
                ? t("statistics.empty")
                : "No activity in this period yet. As you and your team work through products, SBOMs and checklists, your activity will show up here."
          }
        />
      )}
    </div>
  );
}

function Bar({
  value,
  count,
  wide,
}: {
  value: number;
  count: number;
  wide: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "overflow-hidden rounded-tl-md rounded-tr-md bg-[linear-gradient(180deg,#1f8a5b_0%,#2fa56f_120%)] transition-all",
        wide ? "w-6" : "w-full max-w-[14px]",
      )}
      style={{ height: `${clamped}%`, minHeight: clamped > 0 ? 4 : 0 }}
      aria-label={`${count}`}
    />
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-outline bg-muted/40 px-6 py-10 text-center">
      <IconBadge name="Chart" tone="primary" size="lg" />
      <p className="max-w-xs text-p3 text-muted-foreground">{message}</p>
    </div>
  );
}
