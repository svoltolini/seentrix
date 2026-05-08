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
 * ProductDetailShell — solid-blue hero + soft dot-grid overlay (the
 * "Built by Compliance Engineers" recipe from the landing page
 * TrustSection). Earlier passes used a per-product gradient hero
 * (blue → orange → peach) which contradicted the design memory rule
 * "palette only, no per-card gradients". The new recipe lifts the
 * exact JSX pattern used by `<TrustSection />` and the FieldHelp
 * reference callout so every "primary blue panel" surface in the app
 * reads as one family.
 *
 * Below the hero: underlined sub-tabs and the routed tab content.
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
    // Container width matched to /app/dashboard + /app/products
    // (max-w-[1600px]) so every signed-in surface sits on the same
    // horizontal rhythm.
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      {/* Hero — solid bg-primary + radial dot-grid overlay. Verbatim
          recipe from the landing TrustSection / FieldHelp reference
          callout / dashboard hero card so all four surfaces read
          identically. The chip on uploaded product images uses the
          same translucent-white-on-blur recipe as the priority chip
          on the project hero card. */}
      <div className="relative overflow-hidden rounded-md bg-primary p-8 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-start gap-4">
          {product.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="size-16 shrink-0 rounded-md object-cover ring-2 ring-primary-foreground/20"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-l6-plus uppercase tracking-wider text-primary-foreground/80">
              {t("breadcrumbs.products")} · {productId.slice(0, 8)}
            </p>
            <h1 className="truncate text-h1 text-primary-foreground">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-1 max-w-2xl text-p2 text-primary-foreground/90">
                {product.description}
              </p>
            )}
          </div>
          <Button
            variant="default"
            size="default"
            className="shrink-0 border-[1.5px] border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/25"
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
