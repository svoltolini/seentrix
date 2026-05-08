"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductCardList — the "list" view on /app/products.
 *
 * A vertical stack of full-width Nask row cards:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ ┌──┐                                                         │
 *   │ │T │  Product Name        [category chip]                   │
 *   │ └──┘  Software · Created May 8                               │
 *   │                                                              │
 *   │       ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱  73%             [→]   │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Replaces an earlier flat-table list (felt like a different system
 * from the Nask shell) and a brief detour through a three-column
 * kanban (the user wanted "a proper list, not columns"). This is the
 * canonical Linear / Notion list pattern in Nask vocabulary: each
 * product gets one self-contained row card with breathable padding,
 * single soft shadow, hover lift.
 *
 * Visual rhythm:
 *   - Card: bg-card rounded-md shadow-card-sm p-5, hover:shadow-card-md
 *   - Icon block: 48×48 rounded-md, type-tinted, white initial inside
 *   - Body: title (text-h5) over meta line (text-p4 muted)
 *   - Right cluster: category chip + percentage + slim progress bar +
 *     chevron — all at vertical centre
 *
 * Compliance fill colour mirrors the timeline lanes (green/orange/red)
 * so the same product reads identically across every view mode.
 */

const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  hardware: { bg: "bg-primary/10", fg: "text-primary" },
  software: { bg: "bg-accent/10", fg: "text-accent" },
  firmware: { bg: "bg-success/10", fg: "text-success" },
  iot: { bg: "bg-warning/10", fg: "text-warning" },
};

const CATEGORY_TONE: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  important_class_i: "bg-warning/10 text-warning",
  important_class_ii: "bg-accent/10 text-accent",
  critical: "bg-destructive/10 text-destructive",
};

function laneFillFor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 40) return "bg-accent";
  return "bg-destructive";
}

interface Props {
  products: ProductListItem[];
}

export function ProductCardList({ products }: Props) {
  const t = useTranslations("products");

  return (
    <ul className="flex flex-col gap-3">
      {products.map((p) => {
        const tone =
          TYPE_TONE[p.type ?? ""] ?? { bg: "bg-muted", fg: "text-foreground" };
        const categoryKey = p.cra_category ?? "default";
        const categoryTone =
          CATEGORY_TONE[categoryKey] ?? CATEGORY_TONE.default;
        const subtitle = p.type
          ? t.has(`types.${p.type}`)
            ? t(`types.${p.type}`)
            : p.type
          : "Product";
        const dateLabel = new Date(p.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const score = p.compliance_score;
        const fillWidth = Math.max(0, Math.min(100, score));

        return (
          <li key={p.id}>
            <Link
              href={`/app/products/${p.id}`}
              className="group/list-row flex items-center gap-4 rounded-md bg-card p-5 shadow-card-sm transition-shadow hover:shadow-card-md"
            >
              {/* Type-tinted icon block — uses the product's first
                  letter as the glyph so this works whether or not the
                  user has uploaded a real image. The image_url field
                  is intentionally not surfaced here yet; that comes
                  with the detail-page rebuild. */}
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-md text-h5",
                  tone.bg,
                  tone.fg,
                )}
              >
                {p.name[0]?.toUpperCase() ?? "?"}
              </span>

              {/* Title + meta — the structural backbone of the row */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-h5 text-foreground transition-colors group-hover/list-row:text-primary">
                    {p.name}
                  </p>
                  {p.cra_category && (
                    <span
                      className={cn(
                        "shrink-0 rounded-sm px-2 py-0.5 text-l6-plus uppercase tracking-wider",
                        categoryTone,
                      )}
                    >
                      {t.has(`categories.${categoryKey}`)
                        ? t(`categories.${categoryKey}`)
                        : categoryKey.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <p className="truncate text-p4 text-muted-foreground">
                  {subtitle} · {dateLabel}
                </p>
              </div>

              {/* Right cluster: progress + percentage + chevron. The
                  bar is intentionally narrow (w-40) so the title can
                  breathe on smaller viewports. */}
              <div className="hidden shrink-0 items-center gap-3 sm:flex">
                <div className="relative h-1.5 w-40 overflow-hidden rounded-xl bg-border">
                  <div
                    className={cn(
                      "h-full rounded-xl transition-[width] duration-300",
                      laneFillFor(score),
                    )}
                    style={{ width: `${fillWidth}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums text-l6-plus text-foreground">
                  {score}%
                </span>
                <Icon
                  name="arrow-right-01-stroke-rounded"
                  size={16}
                  className="text-muted-foreground transition-colors group-hover/list-row:text-primary"
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
