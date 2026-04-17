"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeIcon } from "@/components/huge-icon";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("nav");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <HugeIcon
              name="alert-02"
              size={24}
              className="text-destructive"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("error")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("errorDescription")}
            </p>
          </div>
          <Button onClick={reset} size="sm">
            {t("tryAgain")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
