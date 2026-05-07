"use client";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * ProjectHeroCard — verbatim 1:1 of the "Project Card" from Figma frame
 * `28:1755` (`data-node-id="50:2655"` / `50:2673`).
 *
 * Geometry: 340×249, `rounded-[10px] overflow-clip shadow-card-md`.
 *   - Background: gradient (or full-bleed image) with a subtle bottom scrim
 *   - Priority chip top-left: `bg-white/20 rounded-[6px] px-3 py-1`
 *   - Title block (left, near bottom): 16/700 white + 14/400 muted-on-tint
 *   - Member stack: 32×32 avatars overlap mr-[-8] at top:155
 *   - Progress bar: 308×6 at top:197, gray track + orange fill, rounded-xl
 */

interface Props {
  title: string;
  subtitle: string;
  href: string;
  /** 0-100 progress score. */
  score: number;
  /** Priority / category chip on the top-left. */
  priority: string;
  /** Optional gradient (defaults to brand). */
  gradient?: string;
  members?: { id: string; name: string; avatarUrl: string | null }[];
}

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #066DE6 0%, #FF6D00 60%, #FF9E55 100%)";

function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function ProjectHeroCard({
  title,
  subtitle,
  href,
  score,
  priority,
  gradient = DEFAULT_GRADIENT,
  members,
}: Props) {
  const fillWidth = Math.max(0, Math.min(100, score));

  return (
    <Link
      href={href}
      className="group/hero-card relative flex h-[249px] w-full max-w-[340px] flex-col justify-between overflow-clip rounded-md p-4 text-white shadow-card-md transition-shadow hover:shadow-card-lg"
      style={{ backgroundImage: gradient }}
    >
      {/* Bottom scrim — matches Figma's gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-foreground/30"
      />

      <div className="relative flex items-start justify-between">
        <span className="inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-l6-plus text-white backdrop-blur-sm">
          {priority}
        </span>
        {members && members.length > 0 && (
          <div className="flex items-end -space-x-2.5">
            {members.slice(0, 3).map((m) => (
              <Avatar key={m.id} size="default" className="ring-2 ring-white/40">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-h5 text-white drop-shadow">{title}</p>
          <p className="line-clamp-1 text-p3 text-white/85">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-xl bg-white/20">
            <div
              className="h-full rounded-xl bg-accent"
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-l6-plus text-white">
            {score}%
          </span>
        </div>
      </div>
    </Link>
  );
}
