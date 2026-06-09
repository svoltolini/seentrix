"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface ReadinessRollupItem {
  id: string;
  name: string;
  percent: number;
}

function barColor(percent: number): string {
  if (percent >= 80) return "bg-success";
  if (percent >= 40) return "bg-warning";
  return "bg-destructive";
}

/**
 * Compact org-wide CRA-readiness roll-up for the dashboard right rail.
 * One row per product: name + a mini progress bar + the percentage, linking
 * to that product's Readiness tab. Sorted least-ready first so the products
 * that need attention sit at the top.
 */
export function ReadinessRollupWidget({
  items,
  emptyLabel,
}: {
  items: ReadinessRollupItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-p3 text-muted-foreground">{emptyLabel}</p>;
  }
  const sorted = [...items].sort((a, b) => a.percent - b.percent).slice(0, 6);

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((item) => (
        <li key={item.id}>
          <Link
            href={`/app/products/${item.id}/readiness`}
            className="group flex items-center gap-3"
          >
            <span className="min-w-0 flex-1 truncate text-p3 text-foreground group-hover:text-primary">
              {item.name}
            </span>
            <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", barColor(item.percent))}
                style={{ width: `${item.percent}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-l6-plus text-muted-foreground">
              {item.percent}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
