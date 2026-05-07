"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressPill } from "@/components/ui/progress-pill";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { CraCategory, ConformityRoute } from "@/lib/constants/cra-classification";
import { CATEGORY_COLORS } from "../../[productId]/constants";

const ROADMAP_STEPS = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step7",
  "step8",
] as const;

function getDeadlineProgress(targetDate: string): number {
  const start = new Date("2024-12-11").getTime();
  const end = new Date(targetDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function AssessmentResult({
  productId,
  category,
  conformityRoute,
  requiresNotifiedBody,
}: {
  productId: string;
  category: CraCategory;
  conformityRoute: ConformityRoute;
  requiresNotifiedBody: boolean;
}) {
  const t = useTranslations("assessment");
  const colors = CATEGORY_COLORS[category];

  const reportingProgress = getDeadlineProgress("2026-09-11");
  const fullComplianceProgress = getDeadlineProgress("2027-12-11");

  return (
    <div className="flex flex-col gap-6">
      {/* Hero classification card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className={cn("flex size-14 items-center justify-center rounded-full", colors?.bg)}>
            <Icon name="shield-check" size={28} className={colors?.icon} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
              {t("result.classification")}
            </p>
            <Badge>
              {t(`result.categories.${category}`)}
            </Badge>
          </div>
          <p className="max-w-md text-p3 leading-relaxed text-muted-foreground">
            {t(`result.categories.${category}Description`)}
          </p>
        </CardContent>
      </Card>

      {/* Conformity route + Notified body — inline */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon name="route-01" size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t("result.conformityRoute")}
                </p>
                <p className="mt-0.5 text-l6 text-foreground">
                  {t(`result.routes.${conformityRoute}`)}
                </p>
              </div>
            </div>

            <div className="hidden h-12 w-px bg-border sm:mx-6 sm:block" />
            <div className="h-px w-full bg-border sm:hidden" />

            <div className="flex flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon name="building-06" size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t("result.notifiedBody")}
                </p>
                <p className="mt-0.5 text-l6 text-foreground">
                  {requiresNotifiedBody ? t("result.yes") : t("result.no")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("result.deadlines")}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-p3 text-muted-foreground">
              {t("result.reportingDeadline")}
            </span>
            <ProgressPill value={reportingProgress}>
              {t("result.reportingDate")}
            </ProgressPill>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-p3 text-muted-foreground">
              {t("result.fullCompliance")}
            </span>
            <ProgressPill value={fullComplianceProgress}>
              {t("result.fullComplianceDate")}
            </ProgressPill>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("result.roadmap")}
          </p>
          <ol className="relative ml-3 flex flex-col gap-0 border-l border-border pl-6">
            {ROADMAP_STEPS.map((step, i) => (
              <li key={step} className="relative pb-5 last:pb-0">
                <div className="absolute -left-[calc(1.5rem+0.5px)] top-0.5 flex size-5 items-center justify-center rounded-full border border-border-outline bg-card text-l6-plus text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-l6 text-foreground">
                    {t(`result.roadmapSteps.${step}`)}
                  </span>
                  <span className="text-p3 leading-snug text-muted-foreground">
                    {t(`result.roadmapSteps.${step}Description`)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/app/products/${productId}`}
          className={buttonVariants({ size: "sm", className: "flex-1" })}
        >
          {t("result.viewProduct")}
          <Icon name="ArrowRightIcon" data-icon="inline-end" className="size-3.5" />
        </Link>
        <Link
          href="/app/products/new"
          className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
        >
          {t("result.addAnother")}
        </Link>
      </div>
    </div>
  );
}
