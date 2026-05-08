"use client";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * ProjectHeroCard — Nask "Project Card" (Figma `142:15578` /
 * `159:16095`).
 *
 * Two-section layout, matching the Figma frame exactly:
 *
 *   ┌──────────────────────────────────────┐
 *   │  Banner (~140px) — full-bleed SVG    │
 *   │  cover (the wavy blue Nask cover     │
 *   │  exported from Figma's Rectangle     │
 *   │  9548 asset → /public/images/        │
 *   │  project-card-cover.svg).            │
 *   │  ┌─────────┐                         │
 *   │  │PRIORITY │ (translucent-white chip,│
 *   │  └─────────┘  top-left, blurred)     │
 *   ├──────────────────────────────────────┤
 *   │  White surface (auto-height)         │
 *   │  Title (text-h5)              avatars│
 *   │  Subtitle (text-p3 muted)            │
 *   │                                      │
 *   │  ▰▰▰▱▱▱▱▱▱▱▱  49 %                  │
 *   └──────────────────────────────────────┘
 *
 * Earlier passes tried (a) per-category gradient covers (red/orange/
 * peach/blue tints) and (b) a flat `bg-primary` + dot-grid panel.
 * Both drifted off-Figma — the actual reference is the wavy SVG art
 * baked into Figma's Nask file. We export the asset once into
 * `public/images/project-card-cover.svg` and reuse it across the
 * dashboard hero strip and the products-list grid card so every
 * "Project Card" surface in the app reads as one family.
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
  /**
   * Optional uploaded photo for the banner (e.g. a product image). When
   * set, the banner renders the photo full-bleed + a soft foreground
   * scrim so the priority chip stays legible on busy imagery — Figma's
   * imageful Project Card path. Falls back to the wavy blue Nask cover
   * (`/public/images/project-card-cover.svg`) when no photo is provided.
   */
  imageUrl?: string | null;
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
  imageUrl,
}: Props) {
  const fillWidth = Math.max(0, Math.min(100, score));
  const hasImage = !!imageUrl;

  return (
    <Link
      href={href}
      // Width fluid (parent grid is `sm:grid-cols-2`); fixed 249 px
      // height matches Figma. Outer card has the soft shadow +
      // rounded-md + overflow-clip so the banner can't bleed past
      // the corners.
      className="group/hero-card relative flex h-[249px] w-full flex-col overflow-clip rounded-md bg-card shadow-card-md transition-shadow hover:shadow-card-lg"
    >
      {/* TOP — 140 px banner. Uploaded product photo if one exists,
          otherwise the wavy blue Nask cover SVG. CSS background-image
          rather than <Image> so we don't fight Next's intrinsic-sizing
          for a purely decorative slab; the SVG ships as a single static
          asset cached forever by Vercel. */}
      <div
        className="relative flex h-[140px] shrink-0 items-start overflow-hidden p-4"
        style={
          hasImage
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                backgroundImage: "url(/images/project-card-cover.svg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
        }
      >
        {/* Soft top-down scrim so the priority chip stays legible on
            busy product photos (Figma's imageful path). The Nask cover
            doesn't need it — the wavy gradient is dark enough on its
            own — so we only paint the scrim when an image is set. */}
        {hasImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-foreground/25 from-[46%] to-transparent to-[102%]"
          />
        )}
        <span className="relative inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
          {priority}
        </span>
      </div>

      {/* BOTTOM — white surface with title + meta + progress. */}
      <div className="flex flex-1 flex-col justify-between gap-3 bg-card p-4">
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
