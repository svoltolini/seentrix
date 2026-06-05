"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { daysUntil } from "@/lib/time";

/**
 * CraCalendarTracker — repurposes the dashboard calendar from decoration into
 * a compliance deadline/task tracker.
 *
 * The month grid marks two kinds of dated work:
 *   - CRA regulatory milestones (statutory, `tone="deadline"`)
 *   - the org's own overdue checklist items (`tone="task"`)
 *
 * Marked days get a coloured dot; selecting a day filters the list below to
 * that day's events. Below the grid, the next few events are listed with a
 * relative countdown and a deep link, so the calendar finally helps customers
 * track what's due — the original ask.
 */

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export interface CalendarEvent {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  tone: "deadline" | "task";
  /** In-app deep link (optional for statutory deadlines). */
  href?: string;
}

interface Props {
  events: CalendarEvent[];
}

function startOfMonthGrid(viewMonth: Date): Date {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
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

/** Local YYYY-MM-DD key (avoids UTC off-by-one from toISOString). */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CraCalendarTracker({ events }: Props) {
  const t = useTranslations("dashboard");
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const today = useMemo(() => new Date(), []);

  // Index events by local date key for O(1) day lookups.
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    return m;
  }, [events]);

  const cells = useMemo(() => {
    const start = startOfMonthGrid(viewMonth);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  function shiftMonth(direction: -1 | 1) {
    const next = new Date(viewMonth);
    next.setDate(1);
    next.setMonth(next.getMonth() + direction);
    setViewMonth(next);
    setSelected(null);
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // List below the grid: when a day is selected show only that day, otherwise
  // the soonest upcoming events across all dates.
  const listEvents = useMemo(() => {
    if (selected) {
      return eventsByDay.get(dateKey(selected)) ?? [];
    }
    return [...events]
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [selected, events, eventsByDay]);

  return (
    <div className="flex flex-col gap-4">
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
            <Icon name="ArrowLeft2" size={16} className="text-muted-foreground" />
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

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === viewMonth.getMonth();
          const isToday = isSameDay(d, today);
          const isSelected = selected && isSameDay(d, selected);
          const dayEvents = eventsByDay.get(dateKey(d)) ?? [];
          const hasDeadline = dayEvents.some((e) => e.tone === "deadline");
          const hasTask = dayEvents.some((e) => e.tone === "task");
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() =>
                setSelected((prev) =>
                  prev && isSameDay(prev, d) ? null : new Date(d),
                )
              }
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-full text-p3 transition-colors",
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
              {(hasDeadline || hasTask) && (
                <span className="absolute bottom-1 flex items-center gap-0.5">
                  {hasDeadline && (
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        isToday ? "bg-accent-foreground" : "bg-destructive",
                      )}
                    />
                  )}
                  {hasTask && (
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        isToday ? "bg-accent-foreground" : "bg-primary",
                      )}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-p4 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-destructive" />
          {t.has("calendar.legendDeadline")
            ? t("calendar.legendDeadline")
            : "CRA deadline"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          {t.has("calendar.legendTask") ? t("calendar.legendTask") : "Your task"}
        </span>
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-2 border-t border-border-outline pt-3">
        <p className="text-p4 font-semibold uppercase tracking-wider text-muted-foreground">
          {selected
            ? selected.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })
            : t.has("calendar.upcoming")
              ? t("calendar.upcoming")
              : "Upcoming"}
        </p>
        {listEvents.length === 0 ? (
          <p className="py-2 text-p3 text-muted-foreground">
            {t.has("calendar.empty")
              ? t("calendar.empty")
              : "Nothing scheduled."}
          </p>
        ) : (
          listEvents.map((e) => <EventRow key={e.id} event={e} t={t} />)
        )}
      </div>
    </div>
  );
}

function EventRow({
  event,
  t,
}: {
  event: CalendarEvent;
  t: ReturnType<typeof useTranslations>;
}) {
  const left = daysUntil(event.date);
  const countdown =
    left <= 0
      ? t.has("calendar.dueToday")
        ? t("calendar.dueToday")
        : "Due today"
      : t.has("calendar.inDays")
        ? t("calendar.inDays", { days: left })
        : `In ${left} days`;

  const body = (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          event.tone === "deadline" ? "bg-destructive" : "bg-primary",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-p3 text-foreground">{event.title}</p>
        <p className="text-p4 text-muted-foreground">{countdown}</p>
      </div>
    </div>
  );

  if (event.href) {
    return (
      <Link href={event.href} className="block outline-none">
        {body}
      </Link>
    );
  }
  return body;
}

function NavBtn({ children, ...props }: React.ComponentProps<"button">) {
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
