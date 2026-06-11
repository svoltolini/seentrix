"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import type { ProductDetail } from "../actions";

const TABS = [
  { key: "overview", segment: "" },
  { key: "readiness", segment: "/readiness" },
  { key: "checklist", segment: "/checklist" },
  { key: "sbom", segment: "/sbom" },
  { key: "vulnerabilities", segment: "/vulnerabilities" },
  { key: "releases", segment: "/releases" },
  { key: "conformity", segment: "/conformity" },
  { key: "riskAssessment", segment: "/risk-assessment" },
  { key: "diagrams", segment: "/diagrams" },
  { key: "documents", segment: "/documents" },
  { key: "technicalFile", segment: "/technical-file" },
  { key: "identity", segment: "/identity" },
  { key: "lifecycle", segment: "/lifecycle" },
] as const;

const CATEGORY_CHIP: Record<string, string> = {
  critical: "bg-[#f4e1da] text-[#a8442f]",
  important_class_ii: "bg-[#f1e9da] text-[#856231]",
  important_class_i: "bg-[#e7eef0] text-[#3d6470]",
  default: "bg-muted text-muted-foreground",
};

/**
 * ProductDetailShell — Clay product header (design `.sx-detail-top`): a back
 * link, the serif product name with a meta row (category badge + type), and
 * an Edit Product action — all on the page background, no coloured hero card.
 * Below: a wrapping pill tab row (no horizontal/vertical scroll) and the
 * routed tab content.
 */
export function ProductDetailShell({
  product,
  productId,
  children,
}: {
  product: ProductDetail;
  productId: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("products");
  const pathname = usePathname();

  const basePath = `/app/products/${productId}`;

  function isActive(segment: string) {
    const tabPath = basePath + segment;
    if (segment === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(tabPath);
  }

  const categoryKey = product.cra_category ?? "default";

  return (
    <div className="space-y-6 pb-12">
      {/* Back to the product list */}
      <Link
        href="/app/products"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {t("breadcrumbs.products")}
      </Link>

      {/* Header — name + meta on the left, Edit on the right */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {product.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="size-14 shrink-0 rounded-md border border-border object-cover"
            />
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-[30px] font-medium leading-tight tracking-[-0.6px] text-foreground">
              {product.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {product.cra_category ? (
                <span
                  className={cn(
                    "rounded-[7px] px-2.5 py-1 text-[11px] font-bold",
                    CATEGORY_CHIP[categoryKey] ?? CATEGORY_CHIP.default,
                  )}
                >
                  {t.has(`categories.${categoryKey}`)
                    ? t(`categories.${categoryKey}`)
                    : categoryKey.replace(/_/g, " ")}
                </span>
              ) : null}
              {product.type && (
                <span className="text-[13px] text-muted-foreground">
                  {t.has(`types.${product.type}`)
                    ? t(`types.${product.type}`)
                    : product.type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Product — opens the edit sheet on the overview tab via ?edit=1 */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          render={<Link href={`${basePath}?edit=1`} />}
        >
          <Icon name="Edit" size={15} />
          {t("detail.editProduct") ?? "Edit Product"}
        </Button>
      </div>

      {/* Tabs — underlined, wrapping (no scrolling) */}
      <nav className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border">
        {TABS.map((tab) => {
          const active = isActive(tab.segment);
          return (
            <Link
              key={tab.key}
              href={`${basePath}${tab.segment}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 py-2.5 text-[13.5px] transition-colors",
                active
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`detail.tabs.${tab.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
