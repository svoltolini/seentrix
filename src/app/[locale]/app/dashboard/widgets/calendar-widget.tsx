"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

/**
 * CalendarWidget — full-month grid.
 *
 * Layout:
 *   - Header: "Month YYYY" (text-h4) + prev/next month icon buttons
 *   - Weekday header row (Mon..Sun, text-p4 muted)
 *   - 6 rows × 7 days grid (always 6 rows so the widget height is
 *     stable across months — visually pads with previous/next month
 *     trailing days at lower opacity)
 *   - Today: orange accent disc
 *   - Selected day (when different from today): primary blue ring
 *   - Out-of-month days: muted-foreground for clear hierarchy
 *
 * Earlier version was a 7-day strip; user asked for the full month so
 * deadlines and meetings can be scanned in one glance.
 */

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface Props {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  className?: string;
}

function startOfMonthGrid(viewMonth: Date): Date {
  // First day of the month
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  // Roll back to Monday of that week. ISO: Mon=0..Sun=6.
  const isoDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const start = new Date(first);
  start.setDate(first.getDate() - isoDow);
  start.setHours(0, 0, 0, 0);
  return start;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarWidget({
  selectedDate,
  onSelectDate,
  className,
}: Props) {
  const t = useTranslations("dashboard");
  // `viewMonth` is the month the user is looking at; defaults to today.
  // Kept separate from `selectedDate` so paging back doesn't change the
  // selection (Notion-style behaviour).
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date());
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    const start = startOfMonthGrid(viewMonth);
    const out: Date[] = [];
    // 6 rows × 7 days = 42 cells. Always render 6 rows so the widget
    // height doesn't jitter month-to-month (Feb takes 4-5 rows, others
    // can take 6 — locking at 6 keeps the rail layout stable).
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [viewMonth]);

  function shiftMonth(direction: -1 | 1) {
    const next = new Date(viewMonth);
    next.setDate(1); // avoid Jan 31 → Mar 3 quirks when shifting
    next.setMonth(next.getMonth() + direction);
    setViewMonth(next);
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-h4 text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-2">
          <NavBtn
            onClick={() => shiftMonth(-1)}
            aria-label={
              t.has("calendar.prev") ? t("calendar.prev") : "Previous month"
            }
          >
            <Icon
              name="ArrowLeft2"
              size={16}
              className="text-muted-foreground"
            />
          </NavBtn>
          <NavBtn
            onClick={() => shiftMonth(1)}
            aria-label={
              t.has("calendar.next") ? t("calendar.next") : "Next month"
            }
          >
            <Icon
              name="ArrowRight2"
              size={16}
              className="text-muted-foreground"
            />
          </NavBtn>
        </div>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_KEYS.map((dayKey) => (
          <span
            key={dayKey}
            className="text-center text-p4-r uppercase tracking-[0.5px] text-muted-foreground"
          >
            {t.has(`calendar.day.${dayKey}`)
              ? t(`calendar.day.${dayKey}`)
              : dayKey.charAt(0).toUpperCase() + dayKey.slice(1, 3)}
          </span>
        ))}
      </div>

      {/* Day grid — 6 rows × 7 cols */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === viewMonth.getMonth();
          const isToday = isSameDay(d, today);
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(d)}
              className={cn(
                // Day cells are circular per Figma — `rounded-full`,
                // not `rounded-md`. The accent disc for today and the
                // primary ring for the selected day both look more
                // polished as circles than as 10 px-radius squares.
                "flex aspect-square items-center justify-center rounded-full text-p3 transition-colors",
                isToday
                  ? "bg-accent font-semibold text-accent-foreground"
                  : isSelected
                    ? "ring-2 ring-primary text-foreground"
                    : inMonth
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/60 hover:bg-muted",
              )}
              aria-label={d.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              aria-current={isToday ? "date" : undefined}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="inline-flex size-7 items-center justify-center rounded-full border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}
