"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { OptionCard } from "../components/option-card";
import { EXCLUDED_SECTORS } from "@/lib/constants/cra-classification";
import type { WizardData } from "@/lib/validations/assessment";

export function StepExcludedSectors({
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

  const noneSelected = data.excludedSectors.length === 0;

  function toggleSector(sector: string) {
    const current = data.excludedSectors;
    const next = current.includes(sector)
      ? current.filter((s) => s !== sector)
      : [...current, sector];
    onChange({ excludedSectors: next });
  }

  function selectNone() {
    onChange({ excludedSectors: [] });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 text-foreground">
          {t("step4.title")}
        </h2>
        <p className="mt-1 text-p2-r text-muted-foreground">
          {t("step4.description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <OptionCard
          title={t("step4.noneApply")}
          description={t("step4.noneApplyDescription")}
          selected={noneSelected}
          onSelect={selectNone}
        />
        <div className="my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("step4.or") || "or"}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {EXCLUDED_SECTORS.map((sector) => (
          <OptionCard
            key={sector}
            title={t(`step4.sectors.${sector}`)}
            description={t(`step4.sectors.${sector}Description`)}
            selected={data.excludedSectors.includes(sector)}
            onSelect={() => toggleSector(sector)}
          />
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <Icon name="ArrowLeftIcon" data-icon="inline-start" className="size-3.5" />
          {t("navigation.back")}
        </Button>
        <Button size="sm" onClick={onNext}>
          {t("navigation.continue")}
          <Icon name="ArrowRightIcon" data-icon="inline-end" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
