"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { OptionCard } from "../components/option-card";
import type { WizardData } from "@/lib/validations/assessment";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export function StepDigitalElements({
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
          {t("step2.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("step2.description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <OptionCard
          title={t("step2.yes")}
          description={t("step2.yesDescription")}
          selected={data.hasDigitalElements === true}
          onSelect={() => onChange({ hasDigitalElements: true })}
        />
        <OptionCard
          title={t("step2.no")}
          description={t("step2.noDescription")}
          selected={data.hasDigitalElements === false}
          onSelect={() => onChange({ hasDigitalElements: false })}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeftIcon data-icon="inline-start" className="size-3.5" />
          {t("navigation.back")}
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={data.hasDigitalElements === null}
        >
          {t("navigation.continue")}
          <ArrowRightIcon data-icon="inline-end" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
