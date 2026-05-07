"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OptionCard } from "../components/option-card";
import type { WizardData } from "@/lib/validations/assessment";

const PRODUCT_TYPES = ["hardware", "software", "firmware", "iot"] as const;

export function StepProductInfo({
  data,
  onChange,
  onNext,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}) {
  const t = useTranslations("assessment");

  const canContinue = data.name.trim().length > 0 && data.type !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t("step1.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("step1.description")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-name">{t("step1.nameLabel")}</Label>
        <Input
          id="product-name"
          type="text"
          placeholder={t("step1.namePlaceholder")}
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("step1.typeLabel")}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRODUCT_TYPES.map((type) => (
            <OptionCard
              key={type}
              title={t(`step1.types.${type}`)}
              description={t(`step1.types.${type}Description`)}
              selected={data.type === type}
              onSelect={() => onChange({ type })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-description">
          {t("step1.descriptionLabel")}
        </Label>
        <Textarea
          id="product-description"
          rows={3}
          placeholder={t("step1.descriptionPlaceholder")}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canContinue} size="sm">
          {t("navigation.continue")}
          <Icon name="ArrowRightIcon" data-icon="inline-end" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
