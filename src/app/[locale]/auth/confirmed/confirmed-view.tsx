"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";

/**
 * "Your email is confirmed" acknowledgement, rendered inside the shared
 * auth card (logo + white card on the gray page background). A single
 * primary CTA continues into account setup.
 */
export function ConfirmedView() {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col items-center text-center">
      {/* Success badge — soft primary-tinted circle with a tick. */}
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon
          name="checkmark-circle-01-stroke-rounded"
          className="size-7 text-primary"
        />
      </div>

      <h1 className="text-h3 text-foreground">{t("confirmed.title")}</h1>
      <p className="mt-1.5 text-p3 leading-relaxed text-muted-foreground">
        {t("confirmed.description")}
      </p>

      <Link href="/auth/onboarding" className="mt-8 w-full">
        <Button className="w-full">
          {t("confirmed.cta")}
          <Icon name="arrow-right-01-stroke-rounded" className="size-4" />
        </Button>
      </Link>
    </div>
  );
}
