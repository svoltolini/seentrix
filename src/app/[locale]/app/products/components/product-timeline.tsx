"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductTimeline — Nask "Project Timeline" view (Figma `67:10518`).
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Jan │ Feb │ Mar │ Apr │ May │ Jun │ ... │ Dec │            │
 *   ├──────┼──────┼──────┼──────┼──────┼──────┼─────┼──────┼──────┤
 *   │ Ahead │ ────[Card]──────────                              │
 *   │       │           ────[Card]─                             │
 *   ├───────┼───────────────────────╢──────────────────────────┤
 *   │ On    │       [Card]──────────╢                           │
 *   │ Track │                      Today                         │
 *   ├───────┼───────────────────────╢───────────────────────────┤
 *   │ At Risk │                    ╢ ────[Card]─────             │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Three swimlanes split by compliance posture, an orange "Today"
 * indicator pinned at the current date, and product cards floated
 * onto the calendar at their `created_at` timestamp. Each card
 * stretches from the product's creation date to the regulatory
 * horizon (the CRA full-compliance deadline, `2027-12-11`) so the
 * width itself communicates "how much runway is left".
 *
 * Earlier passes painted bare coloured bars with the project name
 * embedded; the user pushed back ("I don't like the UI of it") so we
 * land the Figma layout — proper white cards inside each lane with a
 * stronger date strip on top and the today marker.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const LANES = [
  { key: "ahead", titleKey: "timeline.lanes.ahead", min: 75 },
  { key: "onTrack", titleKey: "timeline.lanes.onTrack", min: 40 },
  { key: "atRisk", titleKey: "timeline.lanes.atRisk", min: 0 },
] as const;
type LaneKey = (typeof LANES)[number]["key"];

function laneFor(score: number): LaneKey {
  if (score >= 75) return "ahead";
  if (score >= 40) return "onTrack";
  return "atRisk";
}

const LANE_FILL: Record<LaneKey, string> = {
  ahead: "bg-success",
  onTrack: "bg-accent",
  atRisk: "bg-destructive",
};

interface Props {
  products: ProductListItem[];
  yearStart?: Date;
  basePath?: string;
}

export function ProductTimeline({
  products,
  yearStart = new Date(new Date().getFullYear(), 0, 1),
  basePath = "/app/products",
}: Props) {
  const t = useTranslations("products");

  // Right edge: the CRA "full compliance" deadline — the natural
  // horizon for every product bar. Anything older than `yearStart`
  // is clipped to 0% so a product created last year still shows.
  const horizonEnd = new Date("2027-12-11").getTime();
  const horizonStart = yearStart.getTime();
  const totalMs = horizonEnd - horizonStart;

  const todayPct = useMemo(() => {
    const now = Date.now();
    if (now <= horizonStart) return 0;
    if (now >= horizonEnd) return 100;
    return ((now - horizonStart) / totalMs) * 100;
  }, [horizonStart, horizonEnd, totalMs]);

  function pctFromDate(date: string | Date): number {
    const ts = new Date(date).getTime();
    if (ts <= horizonStart) return 0;
    if (ts >= horizonEnd) return 100;
    return ((ts - horizonStart) / totalMs) * 100;
  }

  const grouped: Record<LaneKey, ProductListItem[]> = {
    ahead: [],
    onTrack: [],
    atRisk: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score)].push(p);

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card-md">
      <div className="overflow-x-auto">
        <div className="grid min-w-[1024px] grid-cols-[120px_1fr]">
          {/* === Header row: lane corner + month strip ============== */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <span className="text-l6-plus uppercase tracking-wider text-muted-foreground">
              {t.has("timeline.horizon")
                ? t("timeline.horizon")
                : `${yearStart.getFullYear()} – 2027`}
            </span>
          </div>
          <div
            className="grid border-b border-border bg-muted/40"
            style={{
              gridTemplateColumns: `repeat(${MONTHS.length}, minmax(0, 1fr))`,
            }}
          >
            {MONTHS.map((m) => (
              <div
                key={m}
                className="border-l border-border px-3 py-3 text-l6-plus uppercase tracking-wider text-muted-foreground first:border-l-0"
              >
                {m}
              </div>
            ))}
          </div>

          {/* === Lanes ============================================ */}
          {LANES.map((lane) => {
            const items = grouped[lane.key];
            return (
              <div key={lane.key} className="contents">
                {/* Left rail — lane title (no rotation; modern Nask
                    drops the rotated text in favour of a clean
                    left-aligned label). */}
                <div className="flex items-center border-b border-border bg-muted/30 px-4 py-4">
                  <span className="text-h6 text-foreground">
                    {t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
                  </span>
                </div>

                {/* Track — month gridlines + today indicator + cards */}
                <div className="relative min-h-[110px] border-b border-border">
                  {/* Vertical month gridlines (decorative). */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${MONTHS.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {MONTHS.map((m) => (
                      <div
                        key={m}
                        className="border-l border-border first:border-l-0"
                      />
                    ))}
                  </div>

                  {/* Today indicator — a thin orange line pinned at
                      `now`. Per Figma, it's a single accent stroke
                      that persists across every lane. The tag is only
                      shown on the first (Ahead) lane to avoid the
                      visual noise of three stacked tags. */}
                  {todayPct > 0 && todayPct < 100 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-accent"
                      style={{ left: `${todayPct}%` }}
                    >
                      {lane.key === "ahead" && (
                        <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-accent px-2 py-0.5 text-l6-plus uppercase tracking-wider text-accent-foreground shadow-card-sm">
                          {t.has("timeline.today")
                            ? t("timeline.today")
                            : "Today"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cards floated on the track. */}
                  {items.length === 0 ? (
                    <p className="px-4 py-6 text-p4 text-muted-foreground">
                      {t.has("timeline.empty")
                        ? t("timeline.empty")
                        : "No products in this lane."}
                    </p>
                  ) : (
                    <ul className="relative flex flex-col gap-2 px-2 py-3">
                      {items.map((p) => {
                        const start = pctFromDate(p.created_at);
                        // Pin the card's left edge at `created_at` and
                        // let it stretch to the regulatory horizon. A
                        // 5% minimum so newly-created products on the
                        // far right still render with a readable card.
                        const width = Math.max(100 - start, 18);
                        return (
                          <li key={p.id}>
                            <TimelineCard
                              product={p}
                              laneKey={lane.key}
                              leftPct={start}
                              widthPct={width}
                              basePath={basePath}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- card on the track ------------------------------------------------

function TimelineCard({
  product,
  laneKey,
  leftPct,
  widthPct,
  basePath,
}: {
  product: ProductListItem;
  laneKey: LaneKey;
  leftPct: number;
  widthPct: number;
  basePath: string;
}) {
  const t = useTranslations("products");
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
      // The card is positioned absolutely inside the track; the
      // `<li>` parent is the layout flow, the card itself floats at
      // the project's start date.
      className="relative block h-[88px]"
      style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%` }}
      aria-label={product.name}
    >
      <div className="group/timeline-card relative flex h-full min-w-[180px] flex-col gap-2 rounded-md bg-card p-3 shadow-card-sm transition-shadow hover:shadow-card-md">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-h6 text-foreground transition-colors group-hover/timeline-card:text-primary">
              {product.name}
            </p>
            <p className="line-clamp-1 text-p4 text-muted-foreground">
              {subtitle} · {dateLabel}
            </p>
          </div>
          <Icon
            name="arrow-right-01-stroke-rounded"
            size={14}
            className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover/timeline-card:text-primary"
          />
        </div>

        <div className="mt-auto flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-xl bg-border">
            <div
              className={cn(
                "h-full rounded-xl transition-[width] duration-300",
                LANE_FILL[laneKey],
              )}
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-l6-plus text-foreground">
            {score}%
          </span>
        </div>
      </div>
    </Link>
  );
}
