"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptionCard } from "../components/option-card";
import {
  ALL_SUBCATEGORIES,
  SUBCATEGORY_GROUPS,
} from "@/lib/constants/cra-classification";
import type { WizardData } from "@/lib/validations/assessment";

export function StepClassification({
  data,
  onChange,
  onBack,
  onSubmit,
  isPending,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("assessment");

  const grouped = SUBCATEGORY_GROUPS.map((group) => ({
    group,
    label: t(`step5.groups.${group}`),
    items: ALL_SUBCATEGORIES.filter((s) => s.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t("step5.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("step5.description")}
        </p>
      </div>

      <OptionCard
        title={t("step5.noneMatch")}
        description={t("step5.noneMatchDescription")}
        selected={data.subcategoryId === null}
        onSelect={() => onChange({ subcategoryId: null })}
      />

      <div className="flex flex-col gap-5">
        {grouped.map(({ group, label, items }) => (
          <div key={group} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {label}
              </h3>
              {items[0] && (
                <Badge>
                  {t(`step5.categoryLabels.${items[0].category}`)}
                </Badge>
              )}
            </div>
            {items.map((sub) => (
              <OptionCard
                key={sub.id}
                title={t(`step5.subcategories.${sub.id}`)}
                selected={data.subcategoryId === sub.id}
                onSelect={() => onChange({ subcategoryId: sub.id })}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <Icon name="ArrowLeftIcon" data-icon="inline-start" className="size-3.5" />
          {t("navigation.back")}
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            t("navigation.submitting")
          ) : (
            <>
              <Icon name="CheckIcon" data-icon="inline-start" className="size-3.5" />
              {t("navigation.submit")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
