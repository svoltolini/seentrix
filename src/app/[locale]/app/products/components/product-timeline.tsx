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
 * frame `163:16266`.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ June 2022 ▾                  Show: Monthly ▾   ◀ 17 June, 2022 ▶│
 *   ├────────────────────────────────────────────────────────────────┤
 *   │ S 10  M 11  T 12  W 13  T 14  F 15  S 16 ●M 17● W 18  T 19 ... │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │       │     │     │     │     │     │     │     │     │     │  │
 *   │   ┌───────────────┐         ┊                                  │
 *   │ O │ Job Seeker    │         ┊                                  │
 *   │ n │ Michael · Jun │         ┊                                  │
 *   │ G │ ▰▰▱ 49% [👥]  │         ┊ Today line                       │
 *   │ o └───────────────┘         ┊                                  │
 *   │ i                  ┌──────────────┐                            │
 *   │ n                  │ Stopify Music│                            │
 *   │ g                  │ Marina · Aug │                            │
 *   │                    │ ▰▱▱ 38% [👥] │                            │
 *   │                    └──────────────┘                            │
 *   ├──────────────────────────────────────┊─────────────────────────┤
 *   │ P  ┌──────────────┐                  ┊         ┌──────────┐    │
 *   │ e  │ NFT Website  │                  ┊         │ Saas Dash│    │
 *   │ ...│              │                  ┊         │          │    │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Key bits of the Figma reference:
 *   1. Header has a current month label (h4 + chevron), a "Show:
 *      Monthly ▾" granularity selector, and a date range with prev /
 *      next chevrons on the right.
 *   2. Day strip below: 14 days at a time, weekday letter on top,
 *      day number below. Today's day is highlighted in `bg-accent
 *      text-accent-foreground` rounded.
 *   3. Three swimlanes labelled vertically (rotated -90deg): "On
 *      Going", "Pending", "Done". Each lane has cards floated at
 *      their `created_at` position within the visible window.
 *   4. Cards are slim white rows: title (h6) + meta + progress + %
 *      + avatar stack. Cards that started before the window peek
 *      from the left edge (clipped); cards starting after the window
 *      are rendered off-screen and reachable via the prev/next nav.
 *   5. A vertical dashed "Today" line cuts through every lane at
 *      today's day column.
 *
 * Seentrix data model: products have `created_at` (start) but no
 * explicit end date. We render each card with an intrinsic ~280 px
 * width starting at its `created_at` column; cards within the window
 * are clickable, ones outside it sit off-canvas until the user pages
 * the window. Lanes split by compliance posture (Done ≥75 %, On
 * Going 40-74, Pending <40), mirroring the kanban list view.
 */

const DAY_WIDTH = 56; // px — width of each day column in the timeline
const VISIBLE_DAYS = 14; // days shown without scrolling
const CARD_WIDTH_PX = 280; // intrinsic card width

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

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / (1000 * 60 * 60 * 24),
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

  // The window's left edge — defaults to seven days ago so today sits
  // roughly mid-window. The user can page back/forward by a week at
  // a time using the < / > buttons in the header.
  const [windowStart, setWindowStart] = useState<Date>(() => {
    const today = startOfDay(new Date());
    return addDays(today, -7);
  });
  const today = useMemo(() => startOfDay(new Date()), []);
  const windowEnd = useMemo(
    () => addDays(windowStart, VISIBLE_DAYS - 1),
    [windowStart],
  );

  // Days to render in the strip
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < VISIBLE_DAYS; i++) out.push(addDays(windowStart, i));
    return out;
  }, [windowStart]);

  const monthLabel = windowStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const rangeLabel = `${windowStart.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  })} – ${windowEnd.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  // Bucket products by lane
  const grouped: Record<LaneKey, ProductListItem[]> = {
    ongoing: [],
    pending: [],
    done: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score)].push(p);

  // Total horizontal pixel width of the day grid — drives both the
  // strip and each lane track so they line up vertically.
  const trackWidth = VISIBLE_DAYS * DAY_WIDTH;

  // Today's pixel offset inside the track (or null if outside)
  const todayOffset = useMemo(() => {
    const dayIdx = daysBetween(windowStart, today);
    if (dayIdx < 0 || dayIdx >= VISIBLE_DAYS) return null;
    return dayIdx * DAY_WIDTH + DAY_WIDTH / 2;
  }, [windowStart, today]);

  function shiftWindow(delta: number) {
    setWindowStart((d) => addDays(d, delta));
  }

  function jumpToToday() {
    setWindowStart(addDays(today, -7));
  }

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card-md">
      {/* === HEADER ============================================== */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <button
          type="button"
          onClick={jumpToToday}
          className="inline-flex items-center gap-2 text-h4 text-foreground transition-colors hover:text-primary"
          aria-label={
            t.has("timeline.goToToday")
              ? t("timeline.goToToday")
              : "Go to today"
          }
        >
          {monthLabel}
          <Icon name="ArrowDown2" size={16} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3">
          {/* Granularity selector — wired but read-only for now;
              monthly is the only mode Seentrix supports until a real
              schedule entity ships. Renders as a Nask filter chip. */}
          <span className="inline-flex h-9 items-center gap-2 rounded-sm border-[1.5px] border-border-outline bg-card px-3 text-l6 text-muted-foreground">
            {t.has("timeline.show") ? t("timeline.show") : "Show"}:{" "}
            <span className="text-foreground">
              {t.has("timeline.granularity.monthly")
                ? t("timeline.granularity.monthly")
                : "Monthly"}
            </span>
            <Icon name="ArrowDown2" size={14} />
          </span>

          {/* Prev / Range / Next */}
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftWindow(-7)}
              className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={
                t.has("timeline.previous") ? t("timeline.previous") : "Previous week"
              }
            >
              <Icon name="ArrowLeft2" size={14} />
            </button>
            <span className="text-p3 text-foreground">{rangeLabel}</span>
            <button
              type="button"
              onClick={() => shiftWindow(7)}
              className="inline-flex size-8 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={
                t.has("timeline.next") ? t("timeline.next") : "Next week"
              }
            >
              <Icon name="ArrowRight2" size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* === DAY STRIP ============================================ */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_1fr] border-b border-border">
          {/* Empty cell above lane labels */}
          <div className="border-r border-border" />

          {/* The day strip itself, fixed-width grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${VISIBLE_DAYS}, ${DAY_WIDTH}px)`,
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

        {/* === LANES =========================================== */}
        {LANES.map((lane) => (
          <LaneRow
            key={lane.key}
            laneKey={lane.key}
            title={
              t.has(lane.titleKey) ? t(lane.titleKey) : lane.key
            }
            products={grouped[lane.key]}
            windowStart={windowStart}
            windowEnd={windowEnd}
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

// Vertical stacking constants for floating cards inside a lane track.
const CARD_HEIGHT_PX = 92;
const CARD_GAP_PX = 8;
const CARD_PADDING_TOP_PX = 12;

function LaneRow({
  title,
  products,
  windowStart,
  windowEnd,
  trackWidth,
  todayOffsetPx,
  basePath,
  t,
}: {
  laneKey: LaneKey;
  title: string;
  products: ProductListItem[];
  windowStart: Date;
  windowEnd: Date;
  trackWidth: number;
  todayOffsetPx: number | null;
  basePath: string;
  t: ReturnType<typeof useTranslations>;
}) {
  // Greedy-pack cards into rows so two products created on adjacent
  // days don't overlap. Sort by `created_at` ascending, then for each
  // card find the first row whose rightmost-occupied pixel is to the
  // left of this card's start. If no row fits, append a new row.
  const layout = useMemo(() => {
    const visible = products.filter((p) => {
      const created = startOfDay(new Date(p.created_at));
      return created >= windowStart && created <= windowEnd;
    });
    const sorted = [...visible].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const rowRightEdges: number[] = [];
    return sorted.map((p) => {
      const created = startOfDay(new Date(p.created_at));
      const left =
        daysBetween(windowStart, created) * DAY_WIDTH + DAY_WIDTH / 2;
      const right = left + CARD_WIDTH_PX + CARD_GAP_PX;
      let row = 0;
      while (row < rowRightEdges.length && rowRightEdges[row]! > left) row++;
      rowRightEdges[row] = right;
      const top =
        CARD_PADDING_TOP_PX + row * (CARD_HEIGHT_PX + CARD_GAP_PX);
      return { product: p, left, top };
    });
  }, [products, windowStart, windowEnd]);

  // Min lane height grows with the number of stacked rows so cards
  // never spill out the bottom of the lane track.
  const rowCount = layout.length === 0 ? 0 : Math.max(
    ...layout.map((l) =>
      Math.round((l.top - CARD_PADDING_TOP_PX) / (CARD_HEIGHT_PX + CARD_GAP_PX)) + 1,
    ),
  );
  const minHeight = Math.max(
    120,
    CARD_PADDING_TOP_PX * 2 + rowCount * (CARD_HEIGHT_PX + CARD_GAP_PX),
  );

  return (
    <div className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0">
      {/* Lane label — rotated -90deg per Figma. Centred vertically
          inside its 60-px column so the type stays readable. */}
      <div
        className="relative border-r border-border"
        style={{ minHeight }}
      >
        <span className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-p4 text-muted-foreground">
          {title}
        </span>
      </div>

      {/* Track — relative-positioned so cards float at their date
          offsets and the today-line is anchored to its day column. */}
      <div className="relative" style={{ width: trackWidth, minHeight }}>
        {/* Today indicator — dashed vertical line cutting through the
            lane, matching Figma's grey dashed stroke. */}
        {todayOffsetPx != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-muted-foreground/50"
            style={{ left: todayOffsetPx }}
          />
        )}

        {layout.length === 0 ? (
          <p className="px-3 pt-3 text-p4 text-muted-foreground">
            {t.has("timeline.empty")
              ? t("timeline.empty")
              : "Nothing in this lane within the visible range."}
          </p>
        ) : (
          layout.map(({ product, left, top }) => (
            <FloatingCard
              key={product.id}
              product={product}
              left={left}
              top={top}
              basePath={basePath}
              t={t}
            />
          ))
        )}
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
