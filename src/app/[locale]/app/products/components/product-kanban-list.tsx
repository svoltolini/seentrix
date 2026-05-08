"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductKanbanList — Nask "Project List" view (Figma `46:2172`).
 *
 * Three swimlane columns split by compliance posture so a quick scan
 * tells you which products are ahead, on track, or behind:
 *
 *   ┌─ Ahead (≥75%) ──┐ ┌─ On track ──┐ ┌─ At risk ──┐
 *   │ • Card           │ │ • Card        │ │ • Card       │
 *   │ • Card           │ │ • Card        │ │              │
 *   │                  │ │               │ │              │
 *   └──────────────────┘ └───────────────┘ └──────────────┘
 *
 * Each card is a slim horizontal row matching the Nask Project Card
 * inside a column (Figma observation: 280×89, white, rounded-md,
 * shadow-card-sm). The row carries title, "creator · date" subtitle,
 * a thin orange progress bar with a percentage badge, and any
 * assigned member avatars on the right.
 *
 * Replaces a previous flat sortable table that felt like a different
 * system from the rest of the Nask shell — the user pushed back with
 * "I don't like the UI of it" so we land the canonical Figma layout.
 *
 * Lanes use the same compliance tiers as `ProductTimeline` so the two
 * view modes paint the same picture in two formats.
 */

const LANES = [
  { key: "ahead", titleKey: "lanes.ahead", min: 75 },
  { key: "onTrack", titleKey: "lanes.onTrack", min: 40 },
  { key: "atRisk", titleKey: "lanes.atRisk", min: 0 },
] as const;
type LaneKey = (typeof LANES)[number]["key"];

function laneFor(score: number): LaneKey {
  if (score >= 75) return "ahead";
  if (score >= 40) return "onTrack";
  return "atRisk";
}

interface Props {
  products: ProductListItem[];
}

export function ProductKanbanList({ products }: Props) {
  const t = useTranslations("products");

  const grouped: Record<LaneKey, ProductListItem[]> = {
    ahead: [],
    onTrack: [],
    atRisk: [],
  };
  for (const p of products) grouped[laneFor(p.compliance_score)].push(p);

  return (
    // Three equal columns at every breakpoint above sm so the swimlanes
    // line up vertically; on small viewports the columns stack so the
    // row cards keep a useful minimum width.
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {LANES.map((lane) => {
        const items = grouped[lane.key];
        return (
          <section
            key={lane.key}
            className="flex min-w-0 flex-col gap-3"
            aria-label={t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
          >
            {/* Column header — title + count chip, mirrors Figma's
                "On Going (3)" header style. The count chip uses the
                same muted recipe as the dashboard meta tags. */}
            <header className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-h5 text-foreground">
                  {t.has(lane.titleKey) ? t(lane.titleKey) : lane.key}
                </h3>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-muted px-1.5 text-l6-plus text-muted-foreground">
                  {items.length}
                </span>
              </div>
            </header>

            {/* Card stack — the empty-lane affordance is intentional;
                a quiet "No products in this lane" line is more useful
                than a vanishing column. */}
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border-outline bg-card px-4 py-6 text-center text-p4 text-muted-foreground">
                {t.has("lanes.empty") ? t("lanes.empty") : "No products here."}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((p) => (
                  <li key={p.id}>
                    <KanbanCard product={p} laneKey={lane.key} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

// --- card --------------------------------------------------------------

const LANE_FILL: Record<LaneKey, string> = {
  ahead: "bg-success",
  onTrack: "bg-accent",
  atRisk: "bg-destructive",
};

function KanbanCard({
  product,
  laneKey,
}: {
  product: ProductListItem;
  laneKey: LaneKey;
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
      href={`/app/products/${product.id}`}
      className="group/kanban-card flex flex-col gap-3 rounded-md bg-card p-4 shadow-card-sm transition-shadow hover:shadow-card-md"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-h6 text-foreground transition-colors group-hover/kanban-card:text-primary">
          {product.name}
        </p>
        <p className="line-clamp-1 text-p4 text-muted-foreground">
          {subtitle} · {dateLabel}
        </p>
      </div>

      {/* Progress row — matches the slim 6 px Nask progress recipe. The
          fill colour mirrors the lane (green / orange / red) so the
          card and its column reinforce each other at a glance. */}
      <div className="flex items-center gap-3">
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
    </Link>
  );
}
