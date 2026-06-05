import { cn } from "@/lib/utils";

/**
 * ReferenceCard — the "CRA Reference" card design.
 *
 * A solid brand-blue (`bg-primary`) surface with a soft white radial dot-grid
 * overlay. Originates from the Glossary term side-sheet "CRA reference" callout
 * and the landing-page TrustSection; this component is the single reusable
 * home for that treatment so every "reference card" across the app reads
 * identically.
 *
 * All content renders in `primary-foreground` (white). Pass `className` to
 * control padding/layout; the dot-grid + blue base are always applied.
 */
export function ReferenceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * ReferenceBadge — the small pill/eyebrow used on a ReferenceCard
 * (translucent white border + fill, uppercase, backdrop-blurred).
 */
export function ReferenceBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border-[1.5px] border-primary-foreground/30 bg-primary-foreground/15 px-2.5 py-0.5 text-l6-plus uppercase tracking-wider text-primary-foreground backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
