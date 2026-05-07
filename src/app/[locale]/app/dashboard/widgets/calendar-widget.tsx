"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

/**
 * CalendarWidget — 7-day strip from Figma frame `28:1755`
 * (`data-name="Group 3"`, id `142:15750`). Geometry:
 *   container 310×119
 *   header row: month/year label (22/700) + Back/Next 34×34 round icon buttons
 *   day strip: 7 columns at gap-12 with weekday label (14/500 muted) + date
 *     (16/600 dark). Selected day has a 36×36 orange ellipse behind it.
 *
 * The widget is purely presentational — pass `selectedDate` to highlight a
 * day (e.g. today). Click handlers fire `onSelectDate` which the parent can
 * use to filter task/meeting widgets to that day.
 */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // ISO Mon=0..Sun=6
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface Props {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  className?: string;
}

export function CalendarWidget({
  selectedDate = new Date(),
  onSelectDate,
  className,
}: Props) {
  const t = useTranslations("dashboard");
  const [anchorWeek, setAnchorWeek] = useState(() => startOfWeek(selectedDate));

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchorWeek);
      d.setDate(anchorWeek.getDate() + i);
      out.push(d);
    }
    return out;
  }, [anchorWeek]);

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function shiftWeek(direction: -1 | 1) {
    const next = new Date(anchorWeek);
    next.setDate(next.getDate() + direction * 7);
    setAnchorWeek(next);
  }

  const monthLabel = anchorWeek.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-h2 text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-2">
          <NavBtn onClick={() => shiftWeek(-1)} aria-label={t.has("calendar.prev") ? t("calendar.prev") : "Previous week"}>
            <Icon name="ArrowLeft2" size={18} className="text-muted-foreground" />
          </NavBtn>
          <NavBtn onClick={() => shiftWeek(1)} aria-label={t.has("calendar.next") ? t("calendar.next") : "Next week"}>
            <Icon name="ArrowRight2" size={18} className="text-muted-foreground" />
          </NavBtn>
        </div>
      </div>

      {/* Day strip */}
      <div className="flex items-end justify-between">
        {days.map((d, i) => {
          const isSelected = isSameDay(d, selectedDate);
          const dayKey = DAY_KEYS[i];
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(d)}
              className="group/day flex flex-col items-center gap-2"
            >
              <span className="text-p3 text-muted-foreground">
                {t.has(`calendar.day.${dayKey}`) ? t(`calendar.day.${dayKey}`) : dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}
              </span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-p2 transition-colors",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {d.getDate()}
              </span>
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
      className="inline-flex size-[34px] items-center justify-center rounded-full border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}
