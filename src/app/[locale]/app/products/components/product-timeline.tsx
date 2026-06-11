"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductTimeline — Nask "Project Timeline" view with a Week / Month
 * toggle and a fluid-width day grid.
 *
 * Earlier passes pinned each day column to a fixed 56 px width which
 * meant a 30-day month rendered ~1680 px wide and required horizontal
 * scrolling. Now the day strip uses `grid-template-columns: repeat(N,
 * minmax(0, 1fr))` so the entire range fits the container width by
 * default; a Week mode lets the user zoom in to a wider per-day cell
 * when more horizontal density is wanted.
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ May 2026  [Today]                  [Week] [Month]   ◀  ▶   │
 *   ├──┬─────────────────────────────────────────────────────────┤
 *   │  │  M     T     W     T     F     S     S     M     T     │
 *   │  │  1     2     3    [4]    5     6     7     8     9     │
 *   ├──┼─────────────────────────────────────────────────────────┤
 *   │ O│      [card]                  ┊                          │
 *   │ G│                              ┊                          │
 *   ├──┼──────────────────────────────┊──────────────────────────┤
 *   │ P│              [card]          ┊                          │
 *   ├──┼──────────────────────────────┊──────────────────────────┤
 *   │ D│                              ┊        [card]            │
 *   └──┴─────────────────────────────────────────────────────────┘
 *
 *   - View modes: `week` (7 days, prev/next steps a week) or `month`
 *     (28-31 days, prev/next steps a month).
 *   - The header shows a label that adapts to the mode: month name
 *     in month mode, "May 4 – May 10, 2026" range in week mode.
 *   - Cards float at their `created_at` day-column. Position uses
 *     percentage so cards stay aligned no matter how the container
 *     is sized; card width still floors at a min so titles stay
 *     readable.
 *   - Lanes match the kanban (`On Going` / `Pending` / `Done`).
 *   - A dashed Today line cuts through every lane when today is
 *     inside the visible window.
 */

type Cadence = "week" | "month";

const LANES = [
  { key: "ongoing", titleKey: "kanban.ongoing", min: 40, max: 75 },
  { key: "pending", titleKey: "kanban.pending", min: 0, max: 40 },
  { key: "done", titleKey: "kanban.done", min: 75, max: 101 },
] as const;
type LaneKey = (typeof LANES)[number]["key"];

function laneFor(score: number): LaneKey {
  if (score >= 75) return "done";
  if (score >= 40) return "ongoing";
  return "pending";
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Monday-anchored week start (ISO calendars). */
function startOfWeek(d: Date): Date {
  const out = startOfDay(d);
  // JS getDay: 0=Sun..6=Sat. ISO: Mon=0..Sun=6. Roll back to Monday.
  const isoDow = out.getDay() === 0 ? 6 : out.getDay() - 1;
  out.setDate(out.getDate() - isoDow);
  return out;
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const out = new Date(start);
  out.setDate(start.getDate() + 6);
  out.setHours(23, 59, 59, 999);
  return out;
}

function shiftMonth(d: Date, delta: number): Date {
  const out = new Date(d);
  out.setDate(1); // dodge Jan 31 → Mar 3 quirks
  out.setMonth(out.getMonth() + delta);
  return out;
}

function shiftDays(d: Date, deltaDays: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + deltaDays);
  return out;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) /
      (1000 * 60 * 60 * 24),
  );
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

  // Cadence + window. The default window is the month of the most
  // recent product creation if the org has products; otherwise the
  // current calendar month. Earlier passes always defaulted to the
  // current month, which left the timeline visibly empty on first
  // paint for orgs whose latest product was created in a prior
  // month — the user reads three blank lanes as "the timeline is
  // broken" rather than "no products in May". Snapping to the
  // active month fixes that without removing the prev/next controls.
  const [cadence, setCadence] = useState<Cadence>("month");
  const [windowStart, setWindowStart] = useState<Date>(() => {
    if (products.length === 0) return startOfMonth(new Date());
    const latest = products.reduce<Date>((max, p) => {
      const created = new Date(p.created_at);
      return created > max ? created : max;
    }, new Date(0));
    return startOfMonth(latest);
  });

  const today = useMemo(() => startOfDay(new Date()), []);

  // Window end + day count derived from cadence.
  const { windowEnd, dayCount } = useMemo(() => {
    if (cadence === "week") {
      return { windowEnd: endOfWeek(windowStart), dayCount: 7 };
    }
    return {
      windowEnd: endOfMonth(windowStart),
      dayCount: daysInMonth(windowStart),
    };
  }, [windowStart, cadence]);

  // Day list for the strip
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < dayCount; i++) {
      out.push(shiftDays(windowStart, i));
    }
    return out;
  }, [windowStart, dayCount]);

  // Today's percentage offset inside the track, or null if outside.
  const todayPct = useMemo(() => {
    if (today < windowStart || today > windowEnd) return null;
    const dayIdx = daysBetween(windowStart, today);
    // Centre the marker inside its day column so it sits under the
    // highlighted day number rather than on the column boundary.
    return ((dayIdx + 0.5) / dayCount) * 100;
  }, [windowStart, windowEnd, today, dayCount]);

  // Header label adapts to cadence.
  const rangeLabel = useMemo(() => {
    if (cadence === "month") {
      return windowStart.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    const sameYear = windowStart.getFullYear() === windowEnd.getFullYear();
    const sameMonth = sameYear && windowStart.getMonth() === windowEnd.getMonth();
    const startFmt = windowStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFmt = windowEnd.toLocaleDateString("en-US", {
      month: sameMonth ? undefined : "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startFmt} – ${endFmt}`;
  }, [cadence, windowStart, windowEnd]);

  const isCurrentRange =
    cadence === "month"
      ? windowStart.getFullYear() === today.getFullYear() &&
        windowStart.getMonth() === today.getMonth()
      : startOfWeek(today).getTime() === windowStart.getTime();

  // Bucket products by lane
  const grouped: Record<LaneKey, ProductListItem[]> = {
    ongoing: [],
    pending: [],
    done: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score)].push(p);

  // How many products fall inside the visible window — used to drive
  // the timeline-level empty state below the lanes when the user
  // pages to a barren month / week.
  const visibleCount = useMemo(
    () =>
      products.filter((p) => {
        const created = startOfDay(new Date(p.created_at));
        return created >= windowStart && created <= windowEnd;
      }).length,
    [products, windowStart, windowEnd],
  );

  function jumpToCurrent() {
    setWindowStart(
      cadence === "week" ? startOfWeek(new Date()) : startOfMonth(new Date()),
    );
  }

  // Used by the empty-window hint below the lanes — snaps the
  // window to the month/week of the most recent product so a quick
  // click on "Jump to latest" always lands on a populated view.
  function jumpToLatestProduct() {
    if (products.length === 0) {
      jumpToCurrent();
      return;
    }
    const latest = products.reduce<Date>((max, p) => {
      const created = new Date(p.created_at);
      return created > max ? created : max;
    }, new Date(0));
    setWindowStart(
      cadence === "week" ? startOfWeek(latest) : startOfMonth(latest),
    );
  }

  function go(delta: number) {
    setWindowStart((d) =>
      cadence === "week"
        ? shiftDays(d, delta * 7)
        : startOfMonth(shiftMonth(d, delta)),
    );
  }

  function setMode(next: Cadence) {
    if (next === cadence) return;
    // Re-anchor the window when switching cadences so the new window
    // contains "today" if possible — without this, jumping from a
    // month view to a week view would leave windowStart on day-1 of
    // the month, which often isn't the start of a calendar week.
    setCadence(next);
    setWindowStart(
      next === "week" ? startOfWeek(new Date()) : startOfMonth(new Date()),
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* === HEADER ============================================== */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <button
          type="button"
          onClick={jumpToCurrent}
          className={cn(
            "inline-flex items-center gap-2 text-h4 transition-colors",
            isCurrentRange
              ? "text-foreground"
              : "text-foreground hover:text-primary",
          )}
          aria-label={
            isCurrentRange
              ? rangeLabel
              : t.has("timeline.goToToday")
                ? t("timeline.goToToday")
                : "Jump to current"
          }
        >
          {rangeLabel}
          {!isCurrentRange && (
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wider text-primary">
              {t.has("timeline.jumpToCurrent")
                ? t("timeline.jumpToCurrent")
                : "Today"}
            </span>
          )}
        </button>

        <div className="inline-flex items-center gap-3">
          {/* Week / Month toggle — same chip recipe as the page-level
              view-mode toggle so all "small toggles" in the products
              surface read as one family. */}
          <div className="inline-flex items-center gap-2">
            {(["week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-sm border-[1.5px] px-3 text-l6 transition-colors",
                  cadence === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={cadence === mode}
              >
                {t.has(`timeline.cadence.${mode}`)
                  ? t(`timeline.cadence.${mode}`)
                  : mode === "week"
                    ? "Week"
                    : "Month"}
              </button>
            ))}
          </div>

          {/* Prev / Next */}
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={
                t.has("timeline.previous")
                  ? t("timeline.previous")
                  : "Previous"
              }
            >
              <Icon name="ArrowLeft2" size={14} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={
                t.has("timeline.next") ? t("timeline.next") : "Next"
              }
            >
              <Icon name="ArrowRight2" size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* === DAY STRIP =========================================== */}
      <div className="grid grid-cols-[60px_1fr] border-b border-border">
        <div className="border-r border-border" />
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
          }}
        >
          {days.map((d) => {
            const isToday = d.getTime() === today.getTime();
            const dayLetter = d
              .toLocaleDateString("en-US", { weekday: "short" })
              .charAt(0);
            return (
              <div
                key={d.toISOString()}
                className="flex flex-col items-center gap-1 px-1 py-3"
              >
                <span className="text-p4-r uppercase tracking-wider text-muted-foreground">
                  {dayLetter}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-l6 tabular-nums",
                    isToday
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* === LANES ============================================== */}
      {LANES.map((lane) => (
        <LaneRow
          key={lane.key}
          laneKey={lane.key}
          title={t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
          products={grouped[lane.key]}
          windowStart={windowStart}
          windowEnd={windowEnd}
          dayCount={dayCount}
          todayPct={todayPct}
          basePath={basePath}
          t={t}
        />
      ))}

      {/* Empty-window hint — only when there are products in the org
          but none happen to fall inside the current view. Without
          this, three blank lanes read as "the timeline is broken"
          when the real issue is "you've paged to a month with no
          products". The CTA jumps the window back to the month of
          the most recent product. */}
      {products.length > 0 && visibleCount === 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <p className="text-p3 text-muted-foreground">
            {t.has("timeline.emptyWindow")
              ? t("timeline.emptyWindow")
              : "No products created in this range."}
          </p>
          <button
            type="button"
            onClick={jumpToLatestProduct}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border-[1.5px] border-border-outline bg-card px-3 text-l6 text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {t.has("timeline.jumpToLatest")
              ? t("timeline.jumpToLatest")
              : "Jump to latest"}
          </button>
        </div>
      )}
    </div>
  );
}

// === Lane row =========================================================

const CARD_HEIGHT_PX = 92;
const CARD_GAP_PX = 8;
const CARD_PADDING_TOP_PX = 12;

function LaneRow({
  title,
  products,
  windowStart,
  windowEnd,
  dayCount,
  todayPct,
  basePath,
  t,
}: {
  laneKey: LaneKey;
  title: string;
  products: ProductListItem[];
  windowStart: Date;
  windowEnd: Date;
  dayCount: number;
  todayPct: number | null;
  basePath: string;
  t: ReturnType<typeof useTranslations>;
}) {
  // Greedy-pack visible cards into rows so adjacent-day creations
  // don't overlap. Card width is now expressed as a percentage of
  // the lane track so it scales with the day grid.
  const layout = useMemo(() => {
    const visible = products.filter((p) => {
      const created = startOfDay(new Date(p.created_at));
      return created >= windowStart && created <= windowEnd;
    });
    const sorted = [...visible].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    // Cards span ~5 day-columns by default but cap at the available
    // remaining columns so they never overflow the right edge.
    const baseSpan = 5;
    const rowRightEdges: number[] = [];
    return sorted.map((p) => {
      const created = startOfDay(new Date(p.created_at));
      const dayIdx = daysBetween(windowStart, created);
      const span = Math.min(baseSpan, dayCount - dayIdx);
      const leftPct = (dayIdx / dayCount) * 100;
      const widthPct = (span / dayCount) * 100;
      // Greedy stacking is computed in dayCount-space (so a card at
      // day 5 occupying days 5-10 reserves a row up to day 10).
      const rightDayIdx = dayIdx + span;
      let row = 0;
      while (row < rowRightEdges.length && rowRightEdges[row]! > dayIdx)
        row++;
      rowRightEdges[row] = rightDayIdx;
      const top = CARD_PADDING_TOP_PX + row * (CARD_HEIGHT_PX + CARD_GAP_PX);
      return { product: p, leftPct, widthPct, top };
    });
  }, [products, windowStart, windowEnd, dayCount]);

  const rowCount =
    layout.length === 0
      ? 0
      : Math.max(
          ...layout.map(
            (l) =>
              Math.round(
                (l.top - CARD_PADDING_TOP_PX) /
                  (CARD_HEIGHT_PX + CARD_GAP_PX),
              ) + 1,
          ),
        );
  const minHeight = Math.max(
    120,
    CARD_PADDING_TOP_PX * 2 + rowCount * (CARD_HEIGHT_PX + CARD_GAP_PX),
  );

  return (
    <div className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0">
      <div
        className="relative border-r border-border"
        style={{ minHeight }}
      >
        <span className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-p4 text-muted-foreground">
          {title}
        </span>
      </div>

      <div className="relative" style={{ minHeight }}>
        {todayPct != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-muted-foreground/50"
            style={{ left: `${todayPct}%` }}
          />
        )}
        {layout.map(({ product, leftPct, widthPct, top }) => (
          <FloatingCard
            key={product.id}
            product={product}
            leftPct={leftPct}
            widthPct={widthPct}
            top={top}
            basePath={basePath}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// === Floating card ====================================================

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FloatingCard({
  product,
  leftPct,
  widthPct,
  top,
  basePath,
  t,
}: {
  product: ProductListItem;
  leftPct: number;
  widthPct: number;
  top: number;
  basePath: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const score = product.compliance_score;
  const fillWidth = Math.max(0, Math.min(100, score));
  const subtitle = product.type
    ? t.has(`types.${product.type}`)
      ? t(`types.${product.type}`)
      : product.type
    : "Product";
  const dateLabel = new Date(product.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`${basePath}/${product.id}`}
      className="group/timeline-card absolute z-20 flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-3"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        // Hard min-width keeps the card readable even when a single
        // day-column gets very narrow (e.g. wide month views on a
        // small viewport). The `max-w` ceiling stops a 5-day card on
        // a wide viewport from running away from the day it belongs
        // to — the card visually anchors at its `created_at` column.
        minWidth: 200,
        maxWidth: 320,
        top,
      }}
      aria-label={product.name}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-h6 text-foreground transition-colors group-hover/timeline-card:text-primary">
          {product.name}
        </p>
        <p className="line-clamp-1 text-p4-r text-muted-foreground">
          {subtitle} · {dateLabel}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-xl bg-border">
          <div
            className="h-full rounded-xl bg-accent transition-[width] duration-300"
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-p4 text-muted-foreground">
          {score}%
        </span>
        <div className="flex shrink-0 items-end -space-x-2">
          <Avatar size="sm" className="ring-2 ring-card">
            <AvatarImage src={undefined} alt={product.name} />
            <AvatarFallback>{initialsOf(product.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </Link>
  );
}
