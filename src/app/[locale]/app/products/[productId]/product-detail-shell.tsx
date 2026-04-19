"use client";

import { useTranslations } from "next-intl";
import { useLinkStatus } from "next/link";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "../actions";

function TabPendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-primary"
    />
  );
}

const TABS = [
  { key: "overview", segment: "" },
  { key: "checklist", segment: "/checklist" },
  { key: "sbom", segment: "/sbom" },
  { key: "vulnerabilities", segment: "/vulnerabilities" },
  { key: "releases", segment: "/releases" },
  { key: "conformity", segment: "/conformity" },
  { key: "documents", segment: "/documents" },
] as const;

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
    <div className="mx-auto max-w-[1120px] space-y-8 pb-12">
      {/* Header with product name */}
      <div className="flex items-start gap-5">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="size-16 shrink-0 rounded-xl border border-white/[0.06] object-cover"
          />
        )}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            {t("breadcrumbs.products")}
          </p>
          <h1 className="mt-1 font-heading text-[28px] font-bold tracking-tight">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-card p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`${basePath}${tab.segment}`}
            className={cn(
              "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isActive(tab.segment)
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`detail.tabs.${tab.key}`)}
            <TabPendingDot />
          </Link>
        ))}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
