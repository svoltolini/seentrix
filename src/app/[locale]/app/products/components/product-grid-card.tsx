"use client";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import type { ProductListItem } from "../actions";

/**
 * ProductGridCard — Nask "Project Card" Grid View, geometry from Figma
 * frame `67:9949`:
 *   container 300×244 (banner 120 + footer 124), `rounded-[10px] overflow-clip`
 *   banner: 300×120 art surface with priority chip top-left
 *   footer: 300×124 bg-white drop-shadow-[0px_4px_45px_rgba(169,173,180,0.15)]
 *   progress: 6×268 (gray track + orange fill)
 *   members: 24×24 avatars, mr-[-10] overlap, right:16, bottom:16
 *
 * Banner art:
 *   - When the product has a real `image_url` → full-bleed image + soft
 *     foreground scrim so the chip stays legible on busy imagery, plus a
 *     translucent white chip (Figma's literal Project Card recipe).
 *   - When there's no image → the Nask Project Card cover SVG
 *     (`/public/images/project-card-cover.svg`, exported verbatim from
 *     Figma's Rectangle 9548 asset). Same asset as the dashboard
 *     ProjectHeroCard so every "Project Card" surface in the app reads
 *     as one family. Replaces an earlier per-category gradient cover
 *     and a flat bg-primary + dot-grid panel — both drifted off-Figma.
 *
 * Seentrix maps:
 *   priority chip → CRA category label (default / important / critical)
 *   progress → compliance_score percentage
 *   members → org members assigned to the product (placeholder until
 *     product↔member assignment ships)
 */

const CATEGORY_LABEL: Record<string, string> = {
  default: "Default",
  important_class_i: "Important · Class I",
  important_class_ii: "Important · Class II",
  critical: "Critical",
};

interface Props {
  product: ProductListItem;
  href: string;
}

export function ProductGridCard({ product, href }: Props) {
  const score = product.compliance_score ?? 0;
  const fillWidth = Math.max(0, Math.min(100, score));
  const category = product.cra_category ?? null;
  const categoryLabel = CATEGORY_LABEL[category ?? "default"];
  const hasImage = !!product.image_url;

  return (
    <Link
      href={href}
      className="group/grid-card flex w-full max-w-[340px] flex-col overflow-clip rounded-md transition-shadow hover:shadow-card-md"
      data-slot="product-grid-card"
    >
      {/* Banner — uploaded image (with scrim) or the Figma Nask cover. */}
      <div
        className="relative flex h-[120px] w-full items-start overflow-hidden"
        style={
          hasImage
            ? undefined
            : {
                backgroundImage: "url(/images/project-card-cover.svg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
        }
      >
        {hasImage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${product.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Soft scrim so the chip + title remain legible on busy imagery */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-foreground/25 from-[46%] to-transparent to-[102%]"
            />
          </>
        )}
        <span className="relative ml-4 mt-4 inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      {/* Footer — title + progress + meta */}
      <div className="relative flex h-[124px] w-full flex-col gap-2 bg-card p-4 shadow-card-sm">
        <div className="flex flex-col gap-1">
          <p className="truncate text-h6 text-foreground">{product.name}</p>
          {product.type && (
            <p className="line-clamp-1 text-p4-r text-muted-foreground">
              {product.type}
            </p>
          )}
        </div>

        {/* Progress bar — 6px track, 15px radius pill (matches Figma) */}
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-xl bg-border">
            <div
              className="h-full rounded-xl bg-accent"
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-l6-plus text-muted-foreground">
            {score}%
          </span>
        </div>

        {/* Footer row: member stack + chevron affordance */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex items-end -space-x-2.5">
            {/* Placeholder avatars — Seentrix does not yet attach members
                to a product entity; surface a neutral chip until that ships. */}
            <Avatar size="sm" className="ring-2 ring-card">
              <AvatarFallback>
                <Icon name="Profile" size={12} />
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover/grid-card:bg-primary group-hover/grid-card:text-primary-foreground">
            <Icon name="arrow-right-01-stroke-rounded" size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
