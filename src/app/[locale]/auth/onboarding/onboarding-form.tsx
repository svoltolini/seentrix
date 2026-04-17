"use client";

import { useActionState, useTransition, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

import { completeOnboarding, type AuthState } from "../actions";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const ENTITY_OPTIONS = [
  "manufacturer",
  "authorised_representative",
  "importer",
  "distributor",
] as const;

const STEP_FIELDS: Record<Step, (keyof OnboardingValues)[]> = {
  1: ["organizationName"],
  2: [
    "legalName",
    "registrationNumber",
    "entityType",
    "addressLine1",
    "postalCode",
    "city",
    "country",
  ],
  3: ["signatoryName", "signatoryPosition", "contactEmail"],
};

export function OnboardingForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<AuthState, FormData>(
    completeOnboarding.bind(null, locale),
    undefined,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { entityType: "manufacturer" },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleNext() {
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function handleBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function onSubmit(data: OnboardingValues) {
    const formData = new FormData();
    formData.set("organizationName", data.organizationName);
    formData.set("legalName", data.legalName);
    formData.set("registrationNumber", data.registrationNumber);
    formData.set("entityType", data.entityType);
    formData.set("addressLine1", data.addressLine1);
    if (data.addressLine2) formData.set("addressLine2", data.addressLine2);
    formData.set("postalCode", data.postalCode);
    formData.set("city", data.city);
    formData.set("country", data.country);
    formData.set("signatoryName", data.signatoryName);
    formData.set("signatoryPosition", data.signatoryPosition);
    formData.set("contactEmail", data.contactEmail);
    if (data.website) formData.set("website", data.website);
    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }
    startTransition(() => formAction(formData));
  }

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}` as Parameters<typeof t>[0])
      ? t(`errors.${state.error}` as Parameters<typeof t>[0])
      : state.error
    : null;

  return (
    <>
      <h1 className="text-center font-heading text-xl font-semibold text-foreground">
        {t("onboarding.title")}
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {t(`onboarding.step${step}.description` as Parameters<typeof t>[0])}
      </p>

      <div className="mt-5 flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "h-1.5 rounded-full transition-all",
              n === step
                ? "w-6 bg-primary"
                : n < step
                  ? "w-4 bg-primary/50"
                  : "w-4 bg-muted",
            )}
          />
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
      >
        {errorMessage && (
          <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted transition-colors hover:bg-muted/80"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Camera className="size-6 text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-[11px] text-muted-foreground/60">
                {t("onboarding.avatarHint")}
              </p>
            </div>

            <Field
              label={t("fields.organizationName")}
              error={errors.organizationName && t("errors.required")}
            >
              <Input
                id="organizationName"
                type="text"
                placeholder={t("fields.organizationNamePlaceholder")}
                aria-invalid={!!errors.organizationName}
                {...register("organizationName")}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field
              label={t("fields.legalName")}
              hint={t("fields.legalNameHint")}
              error={errors.legalName && t("errors.required")}
            >
              <Input
                placeholder={t("fields.legalNamePlaceholder")}
                aria-invalid={!!errors.legalName}
                {...register("legalName")}
              />
            </Field>

            <Field
              label={t("fields.registrationNumber")}
              hint={t("fields.registrationNumberHint")}
              error={errors.registrationNumber && t("errors.required")}
            >
              <Input
                placeholder={t("fields.registrationNumberPlaceholder")}
                aria-invalid={!!errors.registrationNumber}
                {...register("registrationNumber")}
              />
            </Field>

            <Field
              label={t("fields.entityType")}
              hint={t("fields.entityTypeHint")}
              error={errors.entityType && t("errors.required")}
            >
              <select
                aria-invalid={!!errors.entityType}
                {...register("entityType")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ENTITY_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {t(`onboarding.entityType.${v}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={t("fields.addressLine1")}
              error={errors.addressLine1 && t("errors.required")}
            >
              <Input
                placeholder={t("fields.addressLine1Placeholder")}
                aria-invalid={!!errors.addressLine1}
                {...register("addressLine1")}
              />
            </Field>

            <Field label={t("fields.addressLine2")} optional>
              <Input
                placeholder={t("fields.addressLine2Placeholder")}
                {...register("addressLine2")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("fields.postalCode")}
                error={errors.postalCode && t("errors.required")}
              >
                <Input
                  placeholder="10115"
                  aria-invalid={!!errors.postalCode}
                  {...register("postalCode")}
                />
              </Field>
              <Field
                label={t("fields.city")}
                error={errors.city && t("errors.required")}
              >
                <Input
                  placeholder="Berlin"
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
              </Field>
            </div>

            <Field
              label={t("fields.country")}
              error={errors.country && t("errors.required")}
            >
              <Input
                placeholder={t("fields.countryPlaceholder")}
                aria-invalid={!!errors.country}
                {...register("country")}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field
              label={t("fields.signatoryName")}
              hint={t("fields.signatoryNameHint")}
              error={errors.signatoryName && t("errors.required")}
            >
              <Input
                placeholder={t("fields.signatoryNamePlaceholder")}
                aria-invalid={!!errors.signatoryName}
                {...register("signatoryName")}
              />
            </Field>

            <Field
              label={t("fields.signatoryPosition")}
              hint={t("fields.signatoryPositionHint")}
              error={errors.signatoryPosition && t("errors.required")}
            >
              <Input
                placeholder={t("fields.signatoryPositionPlaceholder")}
                aria-invalid={!!errors.signatoryPosition}
                {...register("signatoryPosition")}
              />
            </Field>

            <Field
              label={t("fields.contactEmail")}
              hint={t("fields.contactEmailHint")}
              error={errors.contactEmail && t("errors.emailInvalid")}
            >
              <Input
                type="email"
                placeholder="contact@example.com"
                aria-invalid={!!errors.contactEmail}
                {...register("contactEmail")}
              />
            </Field>

            <Field
              label={t("fields.website")}
              optional
              error={errors.website && t("errors.urlInvalid")}
            >
              <Input
                type="url"
                placeholder="https://example.com"
                {...register("website")}
              />
            </Field>
          </>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          {step > 1 ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="size-4" />
              {t("onboarding.back")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" size="sm" onClick={handleNext}>
              {t("onboarding.next")}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("onboarding.submit")
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | false;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <Label>{label}</Label>
        {optional && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
            optional
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground/60">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
