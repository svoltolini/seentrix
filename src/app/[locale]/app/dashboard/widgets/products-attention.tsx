"use client";

import { Link } from "@/i18n/navigation";

/**
 * "Products needing attention" — the lowest-scoring products in the shared
 * list recipe (same as the CRA readiness / Conformity / Technical File
 * checklists): heading above one bordered card, hairline-divided rows with
 * a muted hover, and a compact score ring on the right colored by band
 * (≥75 green, ≥50 amber, else danger). Whole row links to the product.
 */

export interface AttentionProduct {
  id: string;
  name: string;
  type: string | null;
  categoryLabel: string;
  categoryTone: "critical" | "important_ii" | "important_i" | "default";
  score: number;
}

const CATEGORY_CHIP: Record<AttentionProduct["categoryTone"], string> = {
  critical: "bg-[#f4e1da] text-[#a8442f]",
  important_ii: "bg-[#f1e9da] text-[#856231]",
  important_i: "bg-[#e7eef0] text-[#3d6470]",
  default: "bg-muted text-muted-foreground",
};

function scoreColor(score: number): string {
  if (score >= 75) return "var(--primary)";
  if (score >= 50) return "var(--accent)";
  return "var(--destructive)";
}

export function ProductsAttention({
  title,
  viewAllLabel,
  products,
}: {
  title: string;
  viewAllLabel: string;
  products: AttentionProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-h4 text-foreground">{title}</h2>
        <Link
          href="/app/products"
          className="text-[13.5px] font-semibold text-primary hover:underline"
        >
          {viewAllLabel} →
        </Link>
      </header>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/app/products/${p.id}`}
            className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-l6 text-foreground">{p.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {p.type && (
                  <span className="text-p4 text-muted-foreground">
                    {p.type}
                  </span>
                )}
                <span
                  className={`rounded-[7px] px-2 py-0.5 text-[11px] font-bold ${CATEGORY_CHIP[p.categoryTone]}`}
                >
                  {p.categoryLabel}
                </span>
              </div>
            </div>
            <ScoreRing value={p.score} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 44;
  const thickness = 5;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const color = scoreColor(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary-3)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11.5px] font-bold tabular-nums text-foreground">
        {clamped}
      </span>
    </div>
  );
}
