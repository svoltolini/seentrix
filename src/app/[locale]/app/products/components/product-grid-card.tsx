"use client";

import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "../actions";

/**
 * ProductGridCard — verbatim 1:1 of the Project Card from Figma frame
 * `67:9949` (Project - Grid View). Geometry observed in
 * `data-node-id="99:13322"`:
 *   container 300×244 (banner 120 + footer 124), `rounded-[10px] overflow-clip`
 *   banner: 300×120 with full-bleed image and gradient scrim (rgba(0,0,0,0.25)
 *     at 46% → transparent at 102.66%)
 *   priority chip top-left: bg-[rgba(255,255,255,0.2)] rounded-[6px] px-3 py-1
 *   footer: 300×124 bg-white drop-shadow-[0px_4px_45px_rgba(169,173,180,0.15)]
 *   title: Plus Jakarta Sans Bold 14/1.3 #2c3659 at left:16, top:14
 *   progress: 6×268 at left:16, top:74 (gray track + orange fill)
 *   members: 24×24 avatars, mr-[-10] overlap, right:16, bottom:16
 *
 * Seentrix maps:
 *   priority chip → CRA category label (default / important / critical)
 *   image → product image (or a brand gradient fallback)
 *   progress → compliance_score percentage
 *   members → org members assigned to the product (omitted if none yet)
 */

const CATEGORY_LABEL: Record<string, string> = {
  default: "Default",
  important_class_i: "Important · Class I",
  important_class_ii: "Important · Class II",
  critical: "Critical",
};

function categoryGradient(category: string | null): string {
  switch (category) {
    case "critical":
      return "linear-gradient(135deg, #E60019 0%, #6F4FE0 60%, #066DE6 100%)";
    case "important_class_ii":
      return "linear-gradient(135deg, #FF6D00 0%, #6F4FE0 60%, #066DE6 100%)";
    case "important_class_i":
      return "linear-gradient(135deg, #FF9E55 0%, #066DE6 110%)";
    default:
      return "linear-gradient(135deg, #066DE6 0%, #6F4FE0 60%, #22D3EE 100%)";
  }
}

interface Props {
  product: ProductListItem;
  href: string;
}

export function ProductGridCard({ product, href }: Props) {
  const score = product.compliance_score ?? 0;
  const fillWidth = Math.max(0, Math.min(100, score));
  const category = product.cra_category ?? null;
  const categoryLabel = CATEGORY_LABEL[category ?? "default"];

  return (
    <Link
      href={href}
      className="group/grid-card flex w-full max-w-[340px] flex-col overflow-clip rounded-md transition-shadow hover:shadow-card-md"
      data-slot="product-grid-card"
    >
      {/* Banner — full-bleed gradient or image with priority chip top-left */}
      <div
        className="relative flex h-[120px] w-full items-start"
        style={{
          backgroundImage: product.image_url
            ? `url(${product.image_url})`
            : categoryGradient(category),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Soft scrim so the chip + title remain legible on busy imagery */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-foreground/25 from-[46%] to-transparent to-[102%]"
        />
        <span className="relative ml-4 mt-4 inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-l6-plus text-white backdrop-blur-sm">
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
