"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * RequiresProductEmptyState — shown on screens that have no meaning until the
 * org has at least one product (Incidents, Vulnerability Reports). Instead of
 * rendering an empty table, we explain why the screen is empty and point the
 * user at the one thing that unlocks it: adding a product.
 *
 * The CTA opens the global create-product side sheet over the current page
 * (via `?new=product`) rather than navigating away, matching the topbar
 * "New Product" affordance. Academy and Settings never use this — they work
 * without any products.
 */

interface Props {
  /** i18n key under `<namespace>` for the heading. */
  title: string;
  /** i18n key under `<namespace>` for the body copy. */
  description: string;
  /** i18n key for the CTA label. */
  ctaLabel: string;
  /** next-intl namespace the keys above resolve under. */
  namespace: string;
  /** Icon shown in the badge. */
  icon?: IconName | (string & {});
}

export function RequiresProductEmptyState({
  title,
  description,
  ctaLabel,
  namespace,
  icon = "Box",
}: Props) {
  const t = useTranslations(namespace);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.set("new", "product");
  const sheetHref = `${pathname}?${params.toString()}`;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon name={icon} size={28} className="text-primary" />
      </div>
      <h3 className="text-h4 text-foreground">{t(title)}</h3>
      <p className="mt-2 max-w-md text-p3 text-muted-foreground">
        {t(description)}
      </p>
      {/* Plain <a> so the `?new=product` sheet param survives the navigation. */}
      <a href={sheetHref} className={cn(buttonVariants(), "mt-8")}>
        <Icon name="add-01" size={16} />
        {t(ctaLabel)}
      </a>
    </div>
  );
}
