import { cn } from "@/lib/utils";

/**
 * Gradient KPI tile used at the top of every data-heavy screen. The dashboard,
 * vulnerabilities tab, releases tab, incidents tab, and public reports tab all
 * share the same visual language so a scan across them feels like one product.
 *
 * `from` / `to` define the gradient. Optional `accentDot` adds a small white
 * pulsing dot next to the label — useful for "active" or "exploited" tiles
 * that need to draw the eye.
 */
export function StatCard({
  label,
  from,
  to,
  className,
  accentDot,
  pulse,
  children,
}: {
  label: string;
  from: string;
  to: string;
  className?: string;
  accentDot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2">
          {accentDot && (
            <span
              className={cn(
                "size-1.5 rounded-full bg-white",
                pulse && "animate-pulse",
              )}
            />
          )}
          <p className="text-[11px] font-semibold text-white/75">{label}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
