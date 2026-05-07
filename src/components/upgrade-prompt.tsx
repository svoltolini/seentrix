"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";

export function UpgradePrompt({
  feature,
}: {
  feature: "sbom" | "pdf" | "documents" | "monitoring";
}) {
  const t = useTranslations("upgrade");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Icon name="lock-password-stroke-rounded" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-h4 text-foreground">
            {t(`${feature}.title`)}
          </h3>
          <p className="mt-1 max-w-sm text-p3 text-muted-foreground">
            {t(`${feature}.description`)}
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="gap-1.5">
            <Icon name="sparkles-stroke-rounded" size={14} />
            {t("upgradeCta")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
