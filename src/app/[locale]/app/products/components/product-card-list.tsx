"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import type { ProductListItem } from "../actions";

/**
 * ProductCardList — the Nask "Project List" view, faithful to Figma
 * frame `163:16140`.
 *
 *   ┌─ On Going (3) … ─┐ ┌─ Pending (2) … ─┐ ┌─ Done (1) … ─┐
 *   │ ┌─────────────┐  │ │ ┌─────────────┐ │ │ ┌──────────┐ │
 *   │ │ Title       │  │ │ │ Title       │ │ │ │ Title    │ │
 *   │ │ subtitle    │  │ │ │ subtitle    │ │ │ │ subtitle │ │
 *   │ │ ▰▰▱ 49% [👤]│  │ │ │ ▰▱▱ 12% [👤]│ │ │ │ ▰▰▰ 100%│ │
 *   │ └─────────────┘  │ │ └─────────────┘ │ │ └──────────┘ │
 *   │ ┌─────────────┐  │ │ ┌─────────────┐ │ │              │
 *   │ │ ...         │  │ │ │ ...         │ │ │              │
 *   │ └─────────────┘  │ │ └─────────────┘ │ │              │
 *   │ ┌─ + Add a Card ┐│ │ ┌─ + Add a Card┐│ │              │
 *   └──────────────────┘ └─────────────────┘ └──────────────┘
 *
 * Three status columns split by compliance posture (Seentrix products
 * don't carry an explicit task state; compliance score is the closest
 * proxy that maps cleanly to On Going / Pending / Done):
 *
 *   - Done       (≥75%)  → product is broadly compliance-ready
 *   - On Going   (40-74) → mid-flight, active work
 *   - Pending    (<40)   → unassessed or behind, needs attention
 *
 * Each card inside a column is a slim white row with title (text-h6),
 * "creator · created date" subtitle (text-p4-r muted), a slim orange
 * progress bar, percentage, and any assigned member avatars stacked
 * with -8 px overlap.
 *
 * The "+ Add a Card" footer mirrors Figma's column-bottom CTA — it
 * routes to the new-product wizard so the kanban becomes a viable
 * starting point for adding products without bouncing back to the
 * topbar CTA.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLUMNS = [
  { key: "ongoing", titleKey: "kanban.ongoing", min: 40, max: 75 },
  { key: "pending", titleKey: "kanban.pending", min: 0, max: 40 },
  { key: "done", titleKey: "kanban.done", min: 75, max: 101 },
] as const;
type ColumnKey = (typeof COLUMNS)[number]["key"];

function columnFor(score: number): ColumnKey {
  if (score >= 75) return "done";
  if (score >= 40) return "ongoing";
  return "pending";
}

interface Props {
  products: ProductListItem[];
}

export function ProductCardList({ products }: Props) {
  const t = useTranslations("products");

  const grouped: Record<ColumnKey, ProductListItem[]> = {
    ongoing: [],
    pending: [],
    done: [],
  };
  for (const p of products) grouped[columnFor(p.compliance_score)].push(p);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = grouped[col.key];
        const title = t.has(col.titleKey) ? t(col.titleKey) : col.key;
        return (
          <KanbanColumn
            key={col.key}
            title={title}
            count={items.length}
            items={items}
            t={t}
          />
        );
      })}
    </div>
  );
}

// === Column ===========================================================

function KanbanColumn({
  title,
  count,
  items,
  t,
}: {
  title: string;
  count: number;
  items: ProductListItem[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section
      className="flex min-w-0 flex-col gap-3"
      aria-label={`${title} (${count})`}
    >
      {/* Column header — matches Figma's "On Going (3) … ─────" recipe.
          The dashed hairline runs from the more-icon to the right
          edge of the column, signalling the column boundary without
          adding chrome. */}
      <header className="flex items-center gap-2 px-1">
        <p className="text-p3 text-muted-foreground">
          {title} ({count})
        </p>
        <button
          type="button"
          aria-label={
            t.has("kanban.columnActions") ? t("kanban.columnActions") : "Column actions"
          }
          className="ml-auto inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="MoreCircle" size={16} />
        </button>
      </header>

      {/* Card stack */}
      <ul className="flex flex-col gap-3">
        {items.map((p) => (
          <li key={p.id}>
            <KanbanCard product={p} />
          </li>
        ))}
      </ul>

      {/* Add-a-Card footer — secondary fill, matches the "Add a Card"
          control from the Figma columns. Routes to the new-product
          wizard so the kanban is also an entry point. */}
      <Link
        href="/app/products/new"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3.5 text-l5 text-foreground transition-colors hover:bg-muted"
      >
        <Icon name="PlusIcon" size={16} />
        {t.has("kanban.addCard") ? t("kanban.addCard") : "Add a Card"}
      </Link>
    </section>
  );
}

// === Card =============================================================

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function KanbanCard({ product }: { product: ProductListItem }) {
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
        <p className="line-clamp-1 text-p4-r text-muted-foreground">
          {subtitle} · {dateLabel}
        </p>
      </div>

      {/* Progress + percentage + avatars on a single bottom row, per
          Figma. The bar is `flex-1` so it absorbs any spare width. */}
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
        {/* Placeholder member avatars — Seentrix doesn't yet attach
            members to products, so we show a single neutral avatar
            until that ships, matching the Figma slot. */}
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
