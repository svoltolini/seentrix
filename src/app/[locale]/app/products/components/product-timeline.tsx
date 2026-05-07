"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductTimeline — simplified Gantt-style swimlane view per Figma frame
 * `67:10518`. Horizontal axis = months of the current year; horizontal bars
 * span from product creation to the next CRA deadline. Lanes group by
 * compliance posture so a quick scan tells you which products are ahead of
 * schedule vs. behind.
 *
 * Geometry observed:
 *   container 1098×788 at left:342, top:206
 *   left rail: 58px wide, contains rotated lane labels (-90deg)
 *   each lane: 250px tall, separated by `border-b border-[#f5f5f5]`
 *
 * Seentrix does not store explicit project start/end dates — products have
 * `created_at` only. We map a product onto the axis by `created_at` (start)
 * and the next regulatory deadline (end) and label the bar with the current
 * compliance percentage.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const LANES = [
  { key: "ahead",     titleKey: "timeline.lanes.ahead" },
  { key: "onTrack",   titleKey: "timeline.lanes.onTrack" },
  { key: "atRisk",    titleKey: "timeline.lanes.atRisk" },
] as const;
type LaneKey = (typeof LANES)[number]["key"];

function laneFor(score: number): LaneKey {
  if (score >= 75) return "ahead";
  if (score >= 40) return "onTrack";
  return "atRisk";
}

const LANE_BAR_TONE: Record<LaneKey, string> = {
  ahead: "bg-success",
  onTrack: "bg-primary",
  atRisk: "bg-accent",
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

  // The CRA "full compliance" date — the natural right edge for every bar.
  const horizonEnd = new Date("2027-12-11").getTime();
  const horizonStart = yearStart.getTime();
  const totalMs = horizonEnd - horizonStart;

  function pctFromDate(date: string | Date): number {
    const t = new Date(date).getTime();
    if (t <= horizonStart) return 0;
    if (t >= horizonEnd) return 100;
    return ((t - horizonStart) / totalMs) * 100;
  }

  const grouped: Record<LaneKey, ProductListItem[]> = {
    ahead: [],
    onTrack: [],
    atRisk: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score ?? 0)].push(p);

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card shadow-card-sm">
      <div className="grid min-w-[1024px] grid-cols-[58px_1fr]">
        {/* Header: empty corner + month strip */}
        <div className="border-b border-border" />
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${MONTHS.length}, minmax(0, 1fr))` }}>
          {MONTHS.map((m) => (
            <div
              key={m}
              className="px-2 py-3 text-l6-plus uppercase tracking-wider text-muted-foreground"
            >
              {m}
            </div>
          ))}
        </div>

        {/* Lanes */}
        {LANES.map((lane) => {
          const items = grouped[lane.key];
          return (
            <div key={lane.key} className="contents">
              {/* Left rail — rotated label */}
              <div className="relative min-h-[120px] border-b border-border">
                <span
                  className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-l5 text-foreground"
                >
                  {t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
                </span>
              </div>

              {/* Bars */}
              <div className="relative border-b border-border">
                {/* Vertical month gridlines */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${MONTHS.length}, minmax(0, 1fr))` }}
                >
                  {MONTHS.map((m) => (
                    <div key={m} className="border-l border-border first:border-l-0" />
                  ))}
                </div>

                {items.length === 0 ? (
                  <p className="px-3 py-6 text-p4 text-muted-foreground">
                    {t("timeline.empty")}
                  </p>
                ) : (
                  <ul className="relative flex flex-col gap-2 px-2 py-3">
                    {items.map((p) => {
                      const start = pctFromDate(p.created_at);
                      // Seentrix doesn't have a per-product deadline yet —
                      // use the regulatory horizon as the bar's right edge.
                      const end = 100;
                      const width = Math.max(end - start, 5);
                      return (
                        <li key={p.id}>
                          <Link
                            href={`${basePath}/${p.id}`}
                            className="group/bar relative block h-9 w-full"
                            aria-label={p.name}
                          >
                            <div
                              className={cn(
                                "absolute top-1 flex h-7 items-center gap-2 rounded-sm pl-2 pr-3 text-l6-plus text-white shadow-card-sm",
                                LANE_BAR_TONE[lane.key],
                              )}
                              style={{
                                left: `${start}%`,
                                width: `${width}%`,
                              }}
                            >
                              <span className="truncate">{p.name}</span>
                              <span className="ml-auto shrink-0 tabular-nums text-white/85">
                                {p.compliance_score ?? 0}%
                              </span>
                            </div>
                          </Link>
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
  );
}
