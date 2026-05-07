import { cn } from "@/lib/utils";

/**
 * KPI tile shared across dashboard / vulnerabilities / releases / incidents
 * / public reports. Nask-styled: white card with a soft shadow and a
 * gradient-tinted top accent strip so the original colour-coding still
 * conveys "active" vs "exploited" vs "incident" tones.
 *
 * The legacy `from` / `to` props are kept for API compatibility — they now
 * paint the 4px top accent bar instead of the whole card background.
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
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-md bg-card p-[18px] shadow-card-sm",
        className,
      )}
    >
      {/* Coloured accent stripe along the top edge — replaces the legacy
          full-bleed gradient so we keep the colour cue without losing
          contrast on light surfaces. */}
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      />
      <div className="flex items-center gap-2 pt-1">
        {accentDot && (
          <span
            className={cn(
              "size-1.5 rounded-full",
              pulse && "animate-pulse",
            )}
            style={{ background: from }}
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
