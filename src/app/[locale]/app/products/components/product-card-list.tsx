"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductListItem } from "../actions";

/**
 * ProductCardList — table view for /app/products.
 *
 * Earlier passes tried a vertical row-card list and a three-column
 * kanban (Figma 163:16140). Both worked aesthetically but the user
 * landed on "I want a table" as the canonical scannable format.
 *
 * Columns (always visible above sm; the trailing chevron column is
 * decorative):
 *
 *   Product                Type        Category    Compliance   Created   →
 *   ─────────────────────  ──────────  ──────────  ───────────  ────────  ─
 *   [icon] Name              Software   Important   ▰▰▰▱  73%   May 8     →
 *
 * Wraps the Nask Table primitive (`@/components/ui/table`) so the
 * header row sits on `bg-muted` with `text-h6 (14/700)` and body rows
 * use `text-p3` on white with the soft `bg-muted/60` hover. The whole
 * row is clickable — a `useRouter` push fires on click and Cmd-click
 * still opens in a new tab via the inline `<a>` wrapping the title.
 *
 * Sortable columns: name (alphabetical), compliance, created. Click
 * a header to toggle sort field and direction; the arrow icon flips
 * between ascending and descending.
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

type SortField = "name" | "compliance" | "created";
type SortDir = "asc" | "desc";

interface Props {
  products: ProductListItem[];
}

export function ProductCardList({ products }: Props) {
  const t = useTranslations("products");
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...products].sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "compliance")
        return (a.compliance_score - b.compliance_score) * dir;
      return (
        (new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()) *
        dir
      );
    });
  }, [products, sortField, sortDir]);

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              field="name"
              label={
                t.has("columns.name") ? t("columns.name") : "Product"
              }
              currentField={sortField}
              currentDir={sortDir}
              onClick={toggleSort}
            />
            <TableHead className="hidden sm:table-cell">
              {t.has("columns.type") ? t("columns.type") : "Type"}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t.has("columns.category")
                ? t("columns.category")
                : "Category"}
            </TableHead>
            <SortableHead
              field="compliance"
              label={
                t.has("columns.compliance")
                  ? t("columns.compliance")
                  : "Compliance"
              }
              currentField={sortField}
              currentDir={sortDir}
              onClick={toggleSort}
              className="hidden md:table-cell"
            />
            <SortableHead
              field="created"
              label={
                t.has("columns.created") ? t("columns.created") : "Created"
              }
              currentField={sortField}
              currentDir={sortDir}
              onClick={toggleSort}
              className="hidden lg:table-cell"
            />
            {/* Chevron column — pure affordance, no header label */}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => {
            const tone =
              TYPE_TONE[p.type ?? ""] ?? {
                bg: "bg-muted",
                fg: "text-foreground",
              };
            const categoryKey = p.cra_category ?? null;
            const categoryTone = categoryKey
              ? (CATEGORY_TONE[categoryKey] ?? CATEGORY_TONE.default)
              : "bg-muted text-muted-foreground";
            const subtitle = p.type
              ? t.has(`types.${p.type}`)
                ? t(`types.${p.type}`)
                : p.type
              : "—";
            const dateLabel = new Date(p.created_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" },
            );
            const score = p.compliance_score;
            const fillWidth = Math.max(0, Math.min(100, score));
            const href = `/app/products/${p.id}`;

            return (
              <TableRow
                key={p.id}
                onClick={() => router.push(href)}
                className="cursor-pointer"
              >
                {/* Product cell — icon + name. Wrapped in an anchor
                    so Cmd-click opens in a new tab and screen
                    readers see a real link target. */}
                <TableCell>
                  <a
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md text-l5",
                        tone.bg,
                        tone.fg,
                      )}
                    >
                      {p.name[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="truncate text-h6 text-foreground hover:text-primary">
                      {p.name}
                    </span>
                  </a>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {subtitle}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {categoryKey ? (
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-2 py-0.5 text-l6-plus uppercase tracking-wider",
                        categoryTone,
                      )}
                    >
                      {t.has(`categories.${categoryKey}`)
                        ? t(`categories.${categoryKey}`)
                        : categoryKey.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-p4 text-muted-foreground">
                      {t.has("notAssessed")
                        ? t("notAssessed")
                        : "Not assessed"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-3">
                    <div className="relative h-1.5 w-32 overflow-hidden rounded-xl bg-border">
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
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {dateLabel}
                </TableCell>
                <TableCell className="text-right">
                  <Icon
                    name="arrow-right-01-stroke-rounded"
                    size={16}
                    className="text-muted-foreground"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// === Sortable header cell =============================================

function SortableHead({
  field,
  label,
  currentField,
  currentDir,
  onClick,
  className,
}: {
  field: SortField;
  label: string;
  currentField: SortField;
  currentDir: SortDir;
  onClick: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onClick(field)}
        className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-primary"
      >
        {label}
        <Icon
          name={
            isActive
              ? currentDir === "asc"
                ? "ArrowUp2"
                : "ArrowDown2"
              : "ArrowSwapVertical"
          }
          size={12}
          className={cn(
            "transition-colors",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        />
      </button>
    </TableHead>
  );
}
