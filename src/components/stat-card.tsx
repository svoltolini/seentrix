import { cn } from "@/lib/utils";

/**
 * StatCard — KPI tile shared across Vulnerabilities / Releases /
 * Incidents / public reports.
 *
 * Pure Nask card recipe: white surface, `rounded-md`, `shadow-card-sm`.
 * A 4 px top accent stripe carries the colour cue (severity, status,
 * etc.) without painting the whole card.
 *
 * Earlier passes:
 *   - The first cut painted a full-bleed gradient across the whole
 *     card with white text — invisible-text bug + violated the
 *     palette-only rule.
 *   - The second cut moved the gradient to the 4 px top stripe.
 *     Better, but the user pointed out it's still a gradient.
 *
 * This cut drops the gradient entirely. The `from` prop now paints
 * the stripe as a solid swatch (`to` is kept in the signature for
 * call-site compatibility but ignored). For new code, pass any
 * palette tone you like — `var(--primary)`, `var(--destructive)`,
 * etc. — instead of hex literals.
 */
export function StatCard({
  label,
  from,
  className,
  accentDot,
  pulse,
  children,
}: {
  label: string;
  /** Solid accent colour for the 4 px top stripe (CSS colour string). */
  from: string;
  /** @deprecated kept for call-site compatibility; no longer used. */
  to?: string;
  className?: string;
  accentDot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-lg bg-card p-[18px] shadow-card-sm",
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: from }}
      />
      <div className="flex items-center gap-2 pt-1">
        {accentDot && (
          <span
            className={cn(
              "size-1.5 rounded-full",
              pulse && "animate-pulse",
            )}
            style={{ backgroundColor: from }}
          />
        )}
        <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}
