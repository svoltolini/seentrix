"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export function ChecklistGate({ productId }: { productId: string }) {
  const t = useTranslations("products");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon name="shield-check" size={28} className="text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {t("detail.checklist.notAssessed")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("detail.checklist.notAssessedDescription")}
      </p>
      <Link
        href={`/app/products/${productId}/assess`}
        className={buttonVariants({ className: "mt-8" })}
      >
        {t("detail.checklist.runAssessment")}
      </Link>
    </div>
  );
}
