"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import type { ProductDetail } from "../actions";

const TABS = [
  { key: "overview", segment: "" },
  { key: "checklist", segment: "/checklist" },
  { key: "sbom", segment: "/sbom" },
  { key: "vulnerabilities", segment: "/vulnerabilities" },
  { key: "releases", segment: "/releases" },
  { key: "conformity", segment: "/conformity" },
  { key: "documents", segment: "/documents" },
] as const;

/**
 * ProductDetailShell — Nask Detail-Dashboard hero (frame `41:1171`).
 * Gradient header (blue → purple → teal) + breadcrumb + title + edit CTA,
 * followed by underlined sub-tabs and the routed content.
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

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 pb-12">
      {/* Gradient hero */}
      <div
        className="relative flex flex-col gap-5 overflow-hidden rounded-md p-8 text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #066DE6 0%, #6F4FE0 55%, #22D3EE 100%)",
        }}
      >
        {/* Decorative blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-16 shrink-0 rounded-md ring-2 ring-white/20 object-cover"
            />
          )}
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-l6-plus uppercase tracking-wider text-white">
              {t("breadcrumbs.products")} · {productId.slice(0, 8)}
            </p>
            <h1 className="text-h1 text-white">{product.name}</h1>
            {product.description && (
              <p className="mt-1 max-w-2xl text-p2 text-white">{product.description}</p>
            )}
          </div>
          <Button
            variant="default"
            size="default"
            className="shrink-0 bg-white/15 backdrop-blur-sm hover:bg-white/25"
            render={<Link href={`${basePath}/checklist`} />}
          >
            <Icon name="Edit" size={16} />
            {t("detail.editProduct") ?? "Edit Product"}
          </Button>
        </div>
      </div>

      {/* Tabs (underlined) */}
      <div className="-mx-1 flex items-center gap-6 overflow-x-auto border-b border-border px-1">
        {TABS.map((tab) => {
          const active = isActive(tab.segment);
          return (
            <Link
              key={tab.key}
              href={`${basePath}${tab.segment}`}
              className={cn(
                "relative flex h-11 shrink-0 items-center text-l6 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`detail.tabs.${tab.key}`)}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
