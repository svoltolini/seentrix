"use client";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * ProjectHeroCard — Nask "Project Card" (Figma `142:15578`).
 *
 * Two-section layout, matching the Figma frame exactly:
 *
 *   ┌──────────────────────────────────────┐
 *   │  Solid `bg-primary` surface (~140px) │
 *   │  ┌─────────┐                         │
 *   │  │ Priority │ (dark-navy chip,        │
 *   │  └─────────┘  top-left)              │
 *   │  + soft white dot-grid overlay       │
 *   ├──────────────────────────────────────┤
 *   │  White surface (auto-height)         │
 *   │  Title (text-h5)              avatars │
 *   │  Subtitle (text-p3 muted)             │
 *   │                                       │
 *   │  ▰▰▰▱▱▱▱▱▱▱▱  49 %                  │
 *   └──────────────────────────────────────┘
 *
 * The earlier build used a single full-bleed gradient card that
 * cycled through off-palette colours per CRA category (red/orange/
 * peach/blue gradients). Rule from the design memory: no per-card
 * gradients, palette only. The blue surface here reuses the same
 * recipe as the Help Centre intro sheet's CRA-reference callout —
 * solid `bg-primary` + soft white radial dot-grid overlay — so the
 * visual language is unified across surfaces.
 */

interface Props {
  title: string;
  subtitle: string;
  href: string;
  /** 0-100 progress score. */
  score: number;
  /** Priority / category chip on the top-left. */
  priority: string;
  members?: { id: string; name: string; avatarUrl: string | null }[];
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProjectHeroCard({
  title,
  subtitle,
  href,
  score,
  priority,
  members,
}: Props) {
  const fillWidth = Math.max(0, Math.min(100, score));

  return (
    <Link
      href={href}
      // Width fluid (parent grid is `sm:grid-cols-2`); fixed 249 px
      // height matches the Figma reference. Outer card has the soft
      // shadow + rounded-md + overflow-clip so the blue top never
      // bleeds past the corners.
      className="group/hero-card relative flex h-[249px] w-full flex-col overflow-clip rounded-md bg-card shadow-card-md transition-shadow hover:shadow-card-lg"
    >
      {/* TOP — blue art surface with priority chip + dot-grid overlay.
          Uses the same dot-grid recipe as the FieldHelp reference
          callout + the landing TrustSection so all three surfaces
          read as one family. */}
      <div className="relative flex flex-1 items-start p-4">
        <div className="absolute inset-0 bg-primary" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <span className="relative inline-flex items-center rounded-sm bg-dark-cta px-3 py-1 text-l6-plus uppercase tracking-wider text-dark-cta-foreground">
          {priority}
        </span>
      </div>

      {/* BOTTOM — white surface with title + meta + progress. */}
      <div className="flex shrink-0 flex-col gap-3 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-h5 text-foreground">{title}</p>
            <p className="line-clamp-1 text-p3 text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {members && members.length > 0 && (
            <div className="flex shrink-0 items-end -space-x-2">
              {members.slice(0, 3).map((m) => (
                <Avatar
                  key={m.id}
                  size="sm"
                  className="ring-2 ring-card"
                >
                  <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                  <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-xl bg-border">
            <div
              className="h-full rounded-xl bg-accent transition-[width] duration-300"
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-l6-plus text-foreground">
            {score}%
          </span>
        </div>
      </div>
    </Link>
  );
}
