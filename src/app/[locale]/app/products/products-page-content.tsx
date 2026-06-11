"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { RequiresProductEmptyState } from "@/components/requires-product-empty-state";
import { ProjectHeroCard } from "../dashboard/widgets/project-hero-card";
// (AskSeentrixAI now lives inside RequiresProductEmptyState)
import { ProductTable } from "./components/product-table";
import { ProductTimeline } from "./components/product-timeline";
import type { ProductListItem } from "./actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRODUCT_LIMITS } from "@/lib/constants/plans";

type ViewMode = "table" | "grid" | "timeline";

const CATEGORY_FILTERS = [
  "all",
  "critical",
  "important_class_ii",
  "important_class_i",
  "default",
] as const;

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
  const [view, setView] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORY_FILTERS)[number]>("all");

  // Newest first, then live-filtered by the search query + category pill.
  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...products]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .filter((p) => {
        if (category !== "all" && (p.cra_category ?? "default") !== category)
          return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.type ?? "").toLowerCase().includes(q)
        );
      });
  }, [products, query, category]);

  const limit = PLAN_PRODUCT_LIMITS[plan];

  // Empty org → the same centred "no product" treatment used by Incidents and
  // Vulnerability Reports (icon + copy + CTA + Ask-AI chip), with no page-title
  // chrome, so every "nothing here yet" screen reads identically. The CTA opens
  // the global create-product sheet over this page.
  if (products.length === 0) {
    return (
      <RequiresProductEmptyState
        namespace="products"
        icon="package-open-stroke-rounded"
        title="noProducts"
        description="noProductsDescription"
        ctaLabel="addProduct"
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Section head — Clay eyebrow + serif title + sub (design `.sx-screen-head`) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[1px] text-primary">
            {t.has("eyebrow") ? t("eyebrow") : "Compliance"}
          </p>
          <h1 className="mt-2.5 text-h1 text-foreground">{t("title")}</h1>
          <p className="mt-2.5 max-w-[60ch] text-[14.5px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Toolbar — search + category filter pills + view toggle */}
      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-md border border-border-strong bg-card px-3.5 py-2.5">
            <Icon
              name="SearchNormal1"
              size={16}
              className="shrink-0 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                t.has("searchPlaceholder")
                  ? t("searchPlaceholder")
                  : "Search products…"
              }
              className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((c) => {
              const labelKey = c === "all" ? "filter.all" : `categories.${c}`;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                    category === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {c === "all"
                    ? t.has("filter.all")
                      ? t("filter.all")
                      : "All"
                    : t.has(labelKey)
                      ? t(labelKey)
                      : c.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {(
              [
                { key: "table", iconName: "RowVertical" },
                { key: "grid", iconName: "Grid2" },
                { key: "timeline", iconName: "Calendar" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setView(mode.key)}
                aria-label={
                  t.has(`view.${mode.key}`) ? t(`view.${mode.key}`) : mode.key
                }
                aria-pressed={view === mode.key}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md border transition-colors",
                  view === mode.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon name={mode.iconName} size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan limit banner */}
      {products.length > 0 && !canCreate && (
        <div className="flex items-center gap-4 overflow-hidden rounded-lg bg-card p-[18px] shadow-card-lg">
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

      {/* Body — table (default), card grid, or timeline. Empty state is the
          early return above; an empty *filter* result shows a quiet note. */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center text-[14px] text-muted-foreground">
          {t.has("noMatches") ? t("noMatches") : "No products match your filters."}
        </div>
      ) : view === "table" ? (
        <ProductTable products={sorted} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      ) : (
        <ProductTimeline products={sorted} basePath="/app/products" />
      )}
    </div>
  );
}
