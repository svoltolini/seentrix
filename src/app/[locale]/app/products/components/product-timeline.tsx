"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductTimeline — Nask "Project Timeline" view, faithful to Figma
 * frame `163:16266` with a monthly cadence.
 *
 * Header anchors the visible window:
 *   - Month label (h4) on the left = the month being viewed; click
 *     to snap back to the current real-world month.
 *   - Prev / Next chevrons on the right = step the window by one
 *     calendar month.
 *
 * Below the header sits a day-strip with one column per day in the
 * viewed month (28 / 30 / 31 columns). Today's day is highlighted in
 * `bg-accent`; if today doesn't fall inside the viewed month, no day
 * is highlighted.
 *
 * Three swimlanes (`On Going` / `Pending` / `Done`, same compliance-
 * score split as the kanban list view) carry product cards floated at
 * their `created_at` day-column. Cards are greedy-packed into rows so
 * adjacent-day creations never overlap. Empty lanes render no message
 * — the user wants a quiet empty state, not "no products in this
 * lane" copy filling every row.
 *
 * A dashed vertical Today line cuts through every lane at today's
 * column, when today is inside the visible month.
 */

const DAY_WIDTH = 56; // px — one day column

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

function shiftMonth(d: Date, delta: number): Date {
  const out = new Date(d);
  out.setDate(1); // avoid Jan 31 → Mar 3 quirks when shifting
  out.setMonth(out.getMonth() + delta);
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

  // The first day of the viewed month. Defaults to today's month.
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const today = useMemo(() => startOfDay(new Date()), []);

  const monthEnd = useMemo(() => endOfMonth(viewMonth), [viewMonth]);
  const dayCount = useMemo(() => daysInMonth(viewMonth), [viewMonth]);
  const trackWidth = dayCount * DAY_WIDTH;

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(viewMonth);
      d.setDate(i + 1);
      out.push(d);
    }
    return out;
  }, [viewMonth, dayCount]);

  // Today's pixel offset inside the track, or null if outside the
  // viewed month.
  const todayOffset = useMemo(() => {
    if (today < viewMonth || today > monthEnd) return null;
    const dayIdx = daysBetween(viewMonth, today);
    return dayIdx * DAY_WIDTH + DAY_WIDTH / 2;
  }, [viewMonth, monthEnd, today]);

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  // Bucket products by lane
  const grouped: Record<LaneKey, ProductListItem[]> = {
    ongoing: [],
    pending: [],
    done: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score)].push(p);

  function jumpToCurrentMonth() {
    setViewMonth(startOfMonth(new Date()));
  }

  function go(delta: number) {
    setViewMonth((m) => startOfMonth(shiftMonth(m, delta)));
  }

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card-md">
      {/* === HEADER ============================================== */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <button
          type="button"
          onClick={jumpToCurrentMonth}
          className={cn(
            "inline-flex items-center gap-2 text-h4 transition-colors",
            isCurrentMonth
              ? "text-foreground"
              : "text-foreground hover:text-primary",
          )}
          aria-label={
            isCurrentMonth
              ? monthLabel
              : t.has("timeline.goToToday")
                ? t("timeline.goToToday")
                : "Jump to current month"
          }
        >
          {monthLabel}
          {!isCurrentMonth && (
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wider text-primary">
              {t.has("timeline.jumpToCurrent")
                ? t("timeline.jumpToCurrent")
                : "Today"}
            </span>
          )}
        </button>

        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
            aria-label={
              t.has("timeline.previous")
                ? t("timeline.previous")
                : "Previous month"
            }
          >
            <Icon name="ArrowLeft2" size={14} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
            aria-label={
              t.has("timeline.next") ? t("timeline.next") : "Next month"
            }
          >
            <Icon name="ArrowRight2" size={14} />
          </button>
        </div>
      </header>

      {/* === DAY STRIP + LANES =================================== */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_1fr] border-b border-border">
          <div className="border-r border-border" />
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${dayCount}, ${DAY_WIDTH}px)`,
              width: trackWidth,
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
                  className="flex flex-col items-center gap-1 px-2 py-3"
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

        {LANES.map((lane) => (
          <LaneRow
            key={lane.key}
            laneKey={lane.key}
            title={t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
            products={grouped[lane.key]}
            viewMonthStart={viewMonth}
            viewMonthEnd={monthEnd}
            trackWidth={trackWidth}
            todayOffsetPx={todayOffset}
            basePath={basePath}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// === Lane row =========================================================

const CARD_WIDTH_PX = 280;
const CARD_HEIGHT_PX = 92;
const CARD_GAP_PX = 8;
const CARD_PADDING_TOP_PX = 12;

function LaneRow({
  title,
  products,
  viewMonthStart,
  viewMonthEnd,
  trackWidth,
  todayOffsetPx,
  basePath,
  t,
}: {
  laneKey: LaneKey;
  title: string;
  products: ProductListItem[];
  viewMonthStart: Date;
  viewMonthEnd: Date;
  trackWidth: number;
  todayOffsetPx: number | null;
  basePath: string;
  t: ReturnType<typeof useTranslations>;
}) {
  // Greedy-pack visible cards into rows so adjacent-day creations
  // don't overlap. Sort by created_at, then for each card find the
  // first row whose rightmost-occupied pixel is left of this card's
  // start; if no row fits, append a new one.
  const layout = useMemo(() => {
    const visible = products.filter((p) => {
      const created = startOfDay(new Date(p.created_at));
      return created >= viewMonthStart && created <= viewMonthEnd;
    });
    const sorted = [...visible].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const rowRightEdges: number[] = [];
    return sorted.map((p) => {
      const created = startOfDay(new Date(p.created_at));
      const left =
        daysBetween(viewMonthStart, created) * DAY_WIDTH + DAY_WIDTH / 2;
      const right = left + CARD_WIDTH_PX + CARD_GAP_PX;
      let row = 0;
      while (row < rowRightEdges.length && rowRightEdges[row]! > left) row++;
      rowRightEdges[row] = right;
      const top = CARD_PADDING_TOP_PX + row * (CARD_HEIGHT_PX + CARD_GAP_PX);
      return { product: p, left, top };
    });
  }, [products, viewMonthStart, viewMonthEnd]);

  const rowCount =
    layout.length === 0
      ? 0
      : Math.max(
          ...layout.map(
            (l) =>
              Math.round(
                (l.top - CARD_PADDING_TOP_PX) / (CARD_HEIGHT_PX + CARD_GAP_PX),
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

      <div className="relative" style={{ width: trackWidth, minHeight }}>
        {todayOffsetPx != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-muted-foreground/50"
            style={{ left: todayOffsetPx }}
          />
        )}
        {/* Empty lanes render nothing — the user explicitly didn't
            want "no products" copy filling otherwise quiet rows. */}
        {layout.map(({ product, left, top }) => (
          <FloatingCard
            key={product.id}
            product={product}
            left={left}
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
  left,
  top,
  basePath,
  t,
}: {
  product: ProductListItem;
  left: number;
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
      className="group/timeline-card absolute z-20 flex flex-col gap-2 rounded-md bg-card p-3 shadow-card-sm transition-shadow hover:shadow-card-md"
      style={{
        left,
        top,
        width: CARD_WIDTH_PX,
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
