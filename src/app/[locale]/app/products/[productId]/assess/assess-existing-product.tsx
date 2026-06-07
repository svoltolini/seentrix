"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepIndicator } from "../../new/components/step-indicator";
import { StepDigitalElements } from "../../new/steps/step-digital-elements";
import { StepEuDistribution } from "../../new/steps/step-eu-distribution";
import { StepExcludedSectors } from "../../new/steps/step-excluded-sectors";
import { StepClassification } from "../../new/steps/step-classification";
import {
  OutOfScopeCard,
  type OutOfScopeReason,
} from "../../new/components/out-of-scope-card";
import { classifyProduct } from "@/lib/constants/cra-classification";
import {
  INITIAL_WIZARD_DATA,
  type WizardData,
} from "@/lib/validations/assessment";
import { runAssessmentForProduct } from "./actions";
import type { ProductDetail } from "../../actions";
import { CATEGORY_COLORS } from "../constants";

export function AssessExistingProduct({
  product,
  locale: _locale,
}: {
  product: ProductDetail;
  locale: string;
}) {
  const t = useTranslations("products");
  const tAssessment = useTranslations("assessment");
  const router = useRouter();

  const isAssessed = !!product.cra_category;
  const [showWizard, setShowWizard] = useState(!isAssessed);

  const [step, setStep] = useState(2);
  const [data, setData] = useState<WizardData>({
    ...INITIAL_WIZARD_DATA,
    name: product.name,
    type: (product.type as WizardData["type"]) ?? null,
  });
  const [outOfScope, setOutOfScope] = useState<OutOfScopeReason | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const stepLabels = [
    tAssessment("steps.productInfo"),
    tAssessment("steps.digitalElements"),
    tAssessment("steps.euDistribution"),
    tAssessment("steps.excludedSectors"),
    tAssessment("steps.classification"),
  ];

  function updateData(updates: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function handleStartOver() {
    setData({
      ...INITIAL_WIZARD_DATA,
      name: product.name,
      type: (product.type as WizardData["type"]) ?? null,
    });
    setStep(2);
    setOutOfScope(null);
    setError(null);
  }

  function handleNext() {
    if (step === 2 && data.hasDigitalElements === false) {
      setOutOfScope("noDigitalElements");
      return;
    }
    if (step === 3 && data.isEuDistribution === false) {
      setOutOfScope("noEuDistribution");
      return;
    }
    if (step === 4 && data.excludedSectors.length > 0) {
      setOutOfScope("excludedSector");
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 2));
  }

  function handleSubmit() {
    const classification = classifyProduct(data.subcategoryId);
    startTransition(async () => {
      const result = await runAssessmentForProduct(product.id, {
        hasDigitalElements: data.hasDigitalElements ?? true,
        isEuDistribution: data.isEuDistribution ?? true,
        excludedSectors: data.excludedSectors,
        subcategoryId: data.subcategoryId,
        category: classification.category,
        conformityRoute: classification.conformityRoute,
        requiresNotifiedBody: classification.requiresNotifiedBody,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        setShowWizard(false);
      }
    });
  }

  // Completed state
  if (isAssessed && !showWizard) {
    const colors = CATEGORY_COLORS[product.cra_category!];
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 text-foreground">
              {t("detail.assessment.completed")}
            </h2>
            <p className="mt-1 text-p2-r text-muted-foreground">
              {t("detail.assessment.completedDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              handleStartOver();
              setShowWizard(true);
            }}
          >
            <Icon name="RotateCcwIcon" className="size-3.5" />
            {t("detail.assessment.rerun")}
          </Button>
        </div>

        {/* Results */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-p4-r text-muted-foreground">
                  {tAssessment("result.classification")}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      colors?.dot ?? "bg-muted-foreground"
                    )}
                  />
                  <span className="text-h4 text-foreground">
                    {t(`categories.${product.cra_category}`)}
                  </span>
                </div>
              </div>
              {product.conformity_route && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-p4-r text-muted-foreground">
                    {tAssessment("result.conformityRoute")}
                  </span>
                  <span className="text-h4 text-foreground">
                    {tAssessment(
                      `result.routes.${product.conformity_route}`
                    )}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-p4-r text-muted-foreground">
                  {t("detail.overview.notifiedBody")}
                </span>
                <span className="text-h4 text-foreground">
                  {product.requires_notified_body
                    ? t("detail.overview.yes")
                    : t("detail.overview.no")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Out of scope
  if (outOfScope) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h2 className="text-h3 text-foreground">
            {t("detail.assessment.title")}
          </h2>
        </div>
        <StepIndicator steps={stepLabels} currentStep={step} />
        <OutOfScopeCard reason={outOfScope} onStartOver={handleStartOver} />
      </div>
    );
  }

  // Wizard
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h2 className="text-h3 text-foreground">
          {t("detail.assessment.title")}
        </h2>
      </div>

      <StepIndicator steps={stepLabels} currentStep={step} />

      <Card>
        <CardContent>
          {error && (
            <p className="mb-4 text-p2-r text-destructive">
              {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")}
            </p>
          )}

          <h3 className="mb-4 text-h4 text-foreground">
            {stepLabels[step - 1]}
          </h3>

          {step === 2 && (
            <StepDigitalElements
              data={data}
              onChange={updateData}
              onNext={handleNext}
              onBack={() => {
                if (isAssessed) setShowWizard(false);
              }}
            />
          )}
          {step === 3 && (
            <StepEuDistribution
              data={data}
              onChange={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <StepExcludedSectors
              data={data}
              onChange={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 5 && (
            <StepClassification
              data={data}
              onChange={updateData}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
