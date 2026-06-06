"use client";

import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { Button } from "@/components/ui/button";
import { useCreateProduct } from "@/components/products/create-product-context";

/**
 * RequiresProductEmptyState — the shared "you need a product first" empty
 * state used by every screen that has no meaning until the org has at least
 * one product (Products, Incidents, Vulnerability Reports). One component keeps
 * the icon + heading + body + CTA + "Ask Seentrix AI" chip identical across all
 * three screens.
 *
 * The CTA opens the global create-product side sheet over the current page
 * instantly via `useCreateProduct().open()` (React state, no route nav)
 * rather than navigating away, matching the topbar "New Product" affordance.
 * Academy and Settings never use this — they work without any products.
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
  /** Pre-seeded question for the "Ask Seentrix AI" chip. */
  askSeed?: string;
  /** Label for the "Ask Seentrix AI" chip. */
  askLabel?: string;
}

export function RequiresProductEmptyState({
  title,
  description,
  ctaLabel,
  namespace,
  icon = "package-open-stroke-rounded",
  askSeed,
  askLabel,
}: Props) {
  const t = useTranslations(namespace);
  const { open } = useCreateProduct();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <IconBadge
        name={icon}
        tone="primary"
        iconSize={28}
        className="mb-6 size-14"
      />
      <h3 className="text-h4 text-foreground">{t(title)}</h3>
      <p className="mt-2 max-w-md text-p3 text-muted-foreground">
        {t(description)}
      </p>
      {/* Opens the global sheet instantly via context — no navigation. */}
      <Button type="button" onClick={open} className="mt-8">
        <Icon name="add-01" size={16} />
        {t(ctaLabel)}
      </Button>
      {askSeed && askLabel && (
        <AskSeentrixAI className="mt-4" seed={askSeed} label={askLabel} />
      )}
    </div>
  );
}
