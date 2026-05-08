"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { ProjectHeroCard } from "../dashboard/widgets/project-hero-card";
import { ProductTimeline } from "./components/product-timeline";
import type { ProductListItem } from "./actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRODUCT_LIMITS } from "@/lib/constants/plans";

type ViewMode = "list" | "grid" | "timeline";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const TYPE_ICON_BG: Record<string, string> = {
  hardware: "bg-primary",
  software: "bg-accent",
  firmware: "bg-accent",
  iot: "bg-[#FF9E55]",
};

const CATEGORY_PILL: Record<string, string> = {
  default: "bg-primary",
  important_class_i: "bg-warning",
  important_class_ii: "bg-accent",
  critical: "bg-destructive",
};

function scoreColor(score: number): string {
  if (score >= 75) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

type SortField = "name" | "compliance" | "created";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<ViewMode>("grid");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  // Memoised so the filter + sort doesn't re-run on every keystroke or
  // unrelated state change. Recomputes only when products / search /
  // sortField / sortDir actually change.
  const sorted = useMemo(() => {
    const filtered = search
      ? products.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        )
      : products;

    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "compliance")
        return (a.compliance_score - b.compliance_score) * dir;
      return (
        (new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()) *
        dir
      );
    });
  }, [products, search, sortField, sortDir]);

  const limit = PLAN_PRODUCT_LIMITS[plan];

  return (
    // Container width matched to the dashboard (`max-w-[1600px]`) so the
    // products list sits at the same horizontal rhythm as every other
    // signed-in surface — was 1120 which felt narrow against the Nask
    // shell and made the hero cards too cramped to render.
    <div className="mx-auto max-w-[1600px] space-y-8 pb-12">
      {/* Page header — h1 + p2 muted matches dashboard greeting */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-p2 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <div className="relative">
              <Icon name="SearchIcon" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 rounded-md bg-input pl-9 pr-3 text-p4 text-foreground outline-none placeholder:text-muted-foreground border-[1.5px] border-transparent focus:bg-card focus:border-primary/30"
              />
            </div>
          )}
          {products.length > 0 && canCreate && (
            <Link
              href="/app/products/new"
              className={buttonVariants({ size: "sm" })}
            >
              <Icon name="PlusIcon" className="size-3.5" />
              {t("addProduct")}
            </Link>
          )}
        </div>
      </div>

      {/* View-mode toggle — Grid is default (Figma 67:9949), List preserves the
          current dense table, Timeline gives a Gantt-style horizon. */}
      {products.length > 0 && (
        <div className="flex items-center gap-2">
          {(
            [
              { key: "grid",     iconName: "Grid2" },
              { key: "list",     iconName: "RowVertical" },
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

      {/* Table or empty state */}
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
            {t("noProductsDescription")}
          </p>
          {canCreate && (
            <Link
              href="/app/products/new"
              className={buttonVariants({ className: "mt-8" })}
            >
              <Icon name="PlusIcon" data-icon="inline-start" className="size-4" />
              {t("addProduct")}
            </Link>
          )}
          <AskSeentrixAI
            className="mt-5"
            seed="I'm setting up my first product in Seentrix — what CRA fields do I actually need to fill in?"
            label="New to CRA? Ask Seentrix AI how to set up a product."
          />
        </div>
      ) : view === "grid" ? (
        // Grid view uses the same `<ProjectHeroCard />` as the dashboard
        // "My Products" hero strip — single visual language across both
        // surfaces. When a product has its own `image_url` the banner
        // renders the photo + scrim; otherwise it falls back to the wavy
        // blue Nask cover SVG. The previous build used a smaller
        // `<ProductGridCard />` (300×244) which made the products
        // surface feel like a different system from the dashboard.
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
                imageUrl={p.image_url}
              />
            );
          })}
        </div>
      ) : view === "timeline" ? (
        <ProductTimeline products={sorted} basePath="/app/products" />
      ) : (
        <div className="overflow-hidden rounded-md bg-muted">
          {/* Column headers */}
          <div className="flex items-center border-b border-border px-5 py-2.5">
            {/* Product column (takes flex-1 space) */}
            <button
              type="button"
              onClick={() => toggleSort("name")}
              className="flex flex-1 items-center gap-1.5 text-left"
            >
              <span className="text-h6 text-muted-foreground">
                {t("columns.name")}
              </span>
              <Icon name="ArrowUpDownIcon"
                className={cn(
                  "size-3 text-muted-foreground",
                  sortField === "name" && "text-muted-foreground"
                )}
              />
            </button>

            {/* Category */}
            <span className="hidden w-36 text-h6 text-muted-foreground sm:block">
              {t("columns.category")}
            </span>

            {/* Compliance */}
            <button
              type="button"
              onClick={() => toggleSort("compliance")}
              className="hidden w-44 items-center gap-1.5 md:flex"
            >
              <span className="text-h6 text-muted-foreground">
                {t("columns.compliance")}
              </span>
              <Icon name="ArrowUpDownIcon"
                className={cn(
                  "size-3 text-muted-foreground",
                  sortField === "compliance" && "text-muted-foreground"
                )}
              />
            </button>

            {/* Date */}
            <button
              type="button"
              onClick={() => toggleSort("created")}
              className="hidden w-24 items-center gap-1.5 lg:flex"
            >
              <span className="text-h6 text-muted-foreground">
                {t("columns.created")}
              </span>
              <Icon name="ArrowUpDownIcon"
                className={cn(
                  "size-3 text-muted-foreground",
                  sortField === "created" && "text-muted-foreground"
                )}
              />
            </button>

            {/* Chevron spacer */}
            <div className="w-6" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {sorted.map((product) => {
              const iconBg =
                TYPE_ICON_BG[product.type ?? ""] ?? "bg-muted";
              return (
                <Link
                  key={product.id}
                  href={`/app/products/${product.id}`}
                  className="group flex items-center px-5 py-3.5 transition-colors hover:bg-muted/60"
                >
                  {/* Product: image/icon + name + type */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-l6-plus text-white",
                          iconBg
                        )}
                      >
                        {product.type?.[0]?.toUpperCase() ??
                          product.name[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-l6 text-foreground transition-colors group-hover:text-primary">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-p4 capitalize text-muted-foreground">
                        {product.type
                          ? t(`types.${product.type}`)
                          : "\u2014"}
                      </p>
                    </div>
                  </div>

                  {/* Category pill */}
                  <div className="hidden w-36 sm:block">
                    {product.cra_category ? (
                      <span
                        className={cn(
                          "inline-flex w-28 justify-center rounded-sm px-2.5 py-0.5 text-l6-plus text-white",
                          CATEGORY_PILL[product.cra_category] ??
                            CATEGORY_PILL.default
                        )}
                      >
                        {t(`categories.${product.cra_category}`)}
                      </span>
                    ) : (
                      <span className="text-p4 text-muted-foreground">
                        {t("notAssessed")}
                      </span>
                    )}
                  </div>

                  {/* Compliance */}
                  <div className="hidden w-44 items-center gap-2.5 md:flex">
                    <div className="h-3 w-24 overflow-hidden rounded-sm bg-border">
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{
                          width: `${product.compliance_score}%`,
                          backgroundColor: scoreColor(
                            product.compliance_score
                          ),
                        }}
                      />
                    </div>
                    <span
                      className="text-l6-plus tabular-nums"
                      style={{
                        color: scoreColor(product.compliance_score),
                      }}
                    >
                      {product.compliance_score}%
                    </span>
                  </div>

                  {/* Date */}
                  <div className="hidden w-24 lg:block">
                    <p className="text-p4 text-foreground">
                      {new Date(product.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>

                  {/* Chevron */}
                  <div className="flex w-6 justify-end">
                    <Icon name="ChevronRight" className="size-4 text-muted-foreground transition-colors group-hover:text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
