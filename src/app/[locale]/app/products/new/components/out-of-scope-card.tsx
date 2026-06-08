"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";

export type OutOfScopeReason =
  | "noDigitalElements"
  | "noEuDistribution"
  | "excludedSector";

export function OutOfScopeCard({
  reason,
  onStartOver,
}: {
  reason: OutOfScopeReason;
  onStartOver: () => void;
}) {
  const t = useTranslations("assessment");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <IconBadge name="shield-check" tone="success" size="xl" />
        <div className="flex flex-col gap-1.5">
          <h3 className="text-h3 text-foreground">
            {t("outOfScope.title")}
          </h3>
          <p className="max-w-md text-p3 leading-relaxed text-muted-foreground">
            {t(`outOfScope.reasons.${reason}`)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onStartOver}>
          {t("navigation.startOver")}
        </Button>
      </CardContent>
    </Card>
  );
}
