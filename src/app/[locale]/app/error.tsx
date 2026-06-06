"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";

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
          <IconBadge name="alert-02" tone="destructive" size="xl" />
          <div>
            <h2 className="text-lg font-semibold">{t("error")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("errorDescription")}
            </p>
          </div>
          {/* Two escape hatches: retry (fixes transient failures) and a
              dashboard link (fixes 'this page itself is broken — get me
              out'). Without the second, a persistently failing page traps
              the user on the error screen. */}
          <div className="flex items-center gap-2">
            <Button onClick={reset} size="sm">
              {t("tryAgain")}
            </Button>
            <Link href="/app/dashboard">
              <Button variant="outline" size="sm">
                {t("dashboard")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
