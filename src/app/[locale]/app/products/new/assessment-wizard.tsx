"use client";

import { useState, useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "./components/step-indicator";
import {
  OutOfScopeCard,
  type OutOfScopeReason,
} from "./components/out-of-scope-card";
import { StepProductInfo } from "./steps/step-product-info";
import { StepDigitalElements } from "./steps/step-digital-elements";
import { StepEuDistribution } from "./steps/step-eu-distribution";
import { StepExcludedSectors } from "./steps/step-excluded-sectors";
import { StepClassification } from "./steps/step-classification";
import { AssessmentResult } from "./result/assessment-result";
import {
  createProductWithAssessment,
  type AssessmentState,
} from "./actions";
import { classifyProduct } from "@/lib/constants/cra-classification";
import { INITIAL_WIZARD_DATA, type WizardData } from "@/lib/validations/assessment";

export function AssessmentWizard({ locale }: { locale: string }) {
  const t = useTranslations("assessment");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [outOfScope, setOutOfScope] = useState<OutOfScopeReason | null>(null);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<AssessmentState, FormData>(
    createProductWithAssessment.bind(null, locale),
    undefined
  );

  const stepLabels = [
    t("steps.productInfo"),
    t("steps.digitalElements"),
    t("steps.euDistribution"),
    t("steps.excludedSectors"),
    t("steps.classification"),
  ];

  function updateData(updates: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function handleStartOver() {
    setData(INITIAL_WIZARD_DATA);
    setStep(1);
    setOutOfScope(null);
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
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("type", data.type ?? "");
    formData.set("description", data.description);
    formData.set("hasDigitalElements", String(data.hasDigitalElements));
    formData.set("isEuDistribution", String(data.isEuDistribution));
    formData.set("excludedSectors", JSON.stringify(data.excludedSectors));
    formData.set("subcategoryId", data.subcategoryId ?? "");
    startTransition(() => formAction(formData));
  }

  // Show result if submission succeeded
  if (state?.productId) {
    const classification = classifyProduct(data.subcategoryId);
    return (
      <div className="mx-auto w-full max-w-2xl">
        <AssessmentResult
          productId={state.productId}
          category={classification.category}
          conformityRoute={classification.conformityRoute}
          requiresNotifiedBody={classification.requiresNotifiedBody}
        />
      </div>
    );
  }

  // Show out-of-scope card
  if (outOfScope) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pageDescription")}
          </p>
        </div>
        <StepIndicator steps={stepLabels} currentStep={step} />
        <OutOfScopeCard reason={outOfScope} onStartOver={handleStartOver} />
      </div>
    );
  }

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}`)
      ? t(`errors.${state.error}`)
      : state.error
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      <StepIndicator steps={stepLabels} currentStep={step} />

      <Card>
        <CardContent>
          {errorMessage && (
            <p className="mb-4 text-sm text-destructive">{errorMessage}</p>
          )}

          {step === 1 && (
            <StepProductInfo
              data={data}
              onChange={updateData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <StepDigitalElements
              data={data}
              onChange={updateData}
              onNext={handleNext}
              onBack={handleBack}
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
