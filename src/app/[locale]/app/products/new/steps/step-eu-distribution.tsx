"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { OptionCard } from "../components/option-card";
import type { WizardData } from "@/lib/validations/assessment";

export function StepEuDistribution({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("assessment");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t("step3.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("step3.description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <OptionCard
          title={t("step3.yes")}
          description={t("step3.yesDescription")}
          selected={data.isEuDistribution === true}
          onSelect={() => onChange({ isEuDistribution: true })}
        />
        <OptionCard
          title={t("step3.no")}
          description={t("step3.noDescription")}
          selected={data.isEuDistribution === false}
          onSelect={() => onChange({ isEuDistribution: false })}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <Icon name="ArrowLeftIcon" data-icon="inline-start" className="size-3.5" />
          {t("navigation.back")}
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={data.isEuDistribution === null}
        >
          {t("navigation.continue")}
          <Icon name="ArrowRightIcon" data-icon="inline-end" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
