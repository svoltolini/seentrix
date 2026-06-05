"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { useCreateProduct } from "@/components/products/create-product-context";

const BULLETS = [
  {
    icon: "shield-check",
    titleKey: "bullet1Title",
    descKey: "bullet1Description",
  },
  {
    icon: "checkmark-badge-01-stroke-rounded",
    titleKey: "bullet2Title",
    descKey: "bullet2Description",
  },
  {
    icon: "alert-02",
    titleKey: "bullet3Title",
    descKey: "bullet3Description",
  },
] as const;

export function WelcomeContent() {
  const t = useTranslations("auth.welcome");

  // The primary CTA opens the global create-product side sheet INSTANTLY via
  // React state (the sheet is mounted in `app/layout.tsx` and exposes
  // `useCreateProduct()`), so there's no route-navigation jank.
  const { open } = useCreateProduct();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      {/* Brand mark — uses the real Seentrix logo from /public/logo.svg.
          The SVG ships with a near-black fill, so brightness-0 + invert
          flips it to white against the dark background. */}
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Logo size={26} className="text-primary" />
      </div>

      <h1 className="text-h1 text-foreground">{t("title")}</h1>
      <p className="mt-3 text-p2 text-muted-foreground">{t("subtitle")}</p>

      {/* Feature bullets — borderless cards matching the rest of the
          product (subtle translucent fill, no hard rule). */}
      <div className="mt-8 w-full space-y-3">
        {BULLETS.map((bullet) => (
          <div
            key={bullet.titleKey}
            className="rounded-md bg-card px-4 py-4 shadow-card-sm"
          >
            <div className="flex items-start gap-4 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon
                  name={bullet.icon}
                  size={20}
                  className="text-primary"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-h6 text-foreground">{t(bullet.titleKey)}</p>
                <p className="mt-0.5 text-p3 text-muted-foreground">
                  {t(bullet.descKey)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-10 flex items-center gap-3">
        <Link
          href="/app/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("skipToDashboard")}
        </Link>
        <Button type="button" onClick={open}>
          {t("addFirstProduct")}
        </Button>
      </div>
    </div>
  );
}
