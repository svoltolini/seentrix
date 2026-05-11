"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { ProjectHeroCard } from "../dashboard/widgets/project-hero-card";
import { ProductCardList } from "./components/product-card-list";
import { ProductTimeline } from "./components/product-timeline";
import type { ProductListItem } from "./actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRODUCT_LIMITS } from "@/lib/constants/plans";

type ViewMode = "grid" | "list" | "timeline";

/**
 * /app/products — three view modes over the same product list.
 *
 * Layout matches the dashboard chrome (max-w-[1600px], h1 + p2 muted
 * header) so the signed-in surfaces all read at the same horizontal
 * rhythm.
 *
 *   - Grid (default): same `<ProjectHeroCard />` the dashboard uses
 *   - List: Nask kanban with compliance-posture lanes
 *   - Timeline: horizontal Gantt with a Today indicator
 *
 * The in-page search input was retired — the topbar already carries a
 * global search, so a second box on this page was redundant. Sorting
 * also went away with the flat-table list view; products land in
 * created-date order (newest first), and the kanban + timeline split
 * by compliance posture which is the natural sort for triage anyway.
 */

export function ProductsPageContent({
  products,
  plan,
  canCreate,
  productCount,
}: {
  products: ProductListItem[];
  plan: OrgPlan;
  canCreate: boolean;
  productCount: number;
}) {
  const t = useTranslations("products");
  const [view, setView] = useState<ViewMode>("grid");

  // Newest first — single deterministic order, memoised so unrelated
  // state changes (view toggle) don't re-sort the array.
  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [products],
  );

  const limit = PLAN_PRODUCT_LIMITS[plan];

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-12">
      {/* Page header — h1 + p2 muted matches the dashboard greeting.
          The "+ Add Product" CTA used to live on the right side of
          this row, but the topbar already carries a globally-visible
          "+ New Product" button (which opens the `<CreateProductSheet
          />`), so the page-level duplicate was retired. Same for the
          empty-state CTA below — both routes now flow through the
          topbar button + sheet. */}
      <div>
        <h1 className="text-h1 text-foreground">{t("title")}</h1>
        <p className="mt-2 text-p2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* View-mode toggle — outline chips with active = primary fill.
          Same recipe as the dashboard's "Project Statistics" filter
          chips so every "small toggle" in the app reads as one family. */}
      {products.length > 0 && (
        <div className="flex items-center gap-2">
          {(
            [
              { key: "grid", iconName: "Grid2" },
              { key: "list", iconName: "RowVertical" },
              { key: "timeline", iconName: "Calendar" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setView(mode.key)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-sm border-[1.5px] px-3 text-l6 transition-colors",
                view === mode.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={view === mode.key}
            >
              <Icon name={mode.iconName} size={16} />
              {t.has(`view.${mode.key}`) ? t(`view.${mode.key}`) : mode.key}
            </button>
          ))}
        </div>
      )}

      {/* Plan limit banner */}
      {products.length > 0 && !canCreate && (
        <div className="flex items-center gap-4 overflow-hidden rounded-md bg-card p-[18px] shadow-card-lg">
          <div className="relative flex size-10 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-border"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${(productCount / limit) * 94.2} 94.2`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <span className="absolute text-l6-plus tabular-nums text-foreground">
              {productCount}/{limit}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-p3 text-foreground">{t("limits.reached")}</p>
            <p className="mt-0.5 text-p4 text-muted-foreground">
              {limit === 1
                ? t("limits.reachedDescription", {
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    limit,
                  })
                : t("limits.reachedDescriptionPlural", {
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    limit,
                  })}
            </p>
          </div>
          <Link
            href="/app/settings/billing"
            className={buttonVariants({ size: "sm", className: "shrink-0" })}
          >
            {t("limits.upgrade")}
          </Link>
        </div>
      )}

      {/* Body — empty state, grid, kanban list, or timeline. */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Icon
              name="package-open-stroke-rounded"
              size={28}
              className="text-primary"
            />
          </div>
          <h3 className="text-h4 text-foreground">{t("noProducts")}</h3>
          <p className="mt-2 max-w-md text-p3 text-muted-foreground">
            {canCreate
              ? (t.has("noProductsDescriptionTopbar")
                  ? t("noProductsDescriptionTopbar")
                  : t("noProductsDescription"))
              : t("noProductsDescription")}
          </p>
          {/* No CTA here — the topbar's "+ New Product" button is the
              global entry point and stays visible on the empty state
              too, so a second button next to it just adds noise. */}
          <AskSeentrixAI
            className="mt-8"
            seed="I'm setting up my first product in Seentrix — what CRA fields do I actually need to fill in?"
            label="New to CRA? Ask Seentrix AI how to set up a product."
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => {
            const categoryKey = p.cra_category ?? "default";
            const categoryLabelKey = `categories.${categoryKey}`;
            const subtitleKey = p.type ? `types.${p.type}` : null;
            return (
              <ProjectHeroCard
                key={p.id}
                title={p.name}
                subtitle={
                  subtitleKey && t.has(subtitleKey)
                    ? t(subtitleKey)
                    : (p.type ?? "Product")
                }
                href={`/app/products/${p.id}`}
                score={p.compliance_score}
                priority={
                  t.has(categoryLabelKey)
                    ? t(categoryLabelKey)
                    : categoryKey.replace(/_/g, " ")
                }
              />
            );
          })}
        </div>
      ) : view === "list" ? (
        <ProductCardList products={sorted} />
      ) : (
        <ProductTimeline products={sorted} basePath="/app/products" />
      )}
    </div>
  );
}
