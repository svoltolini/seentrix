"use client";

import { useActionState, useTransition, useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { createProduct, type ProductActionState } from "../actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRODUCT_LIMITS } from "@/lib/constants/plans";
import { FieldHelp } from "@/components/field-help";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = ["hardware", "software", "firmware", "iot"] as const;

export function CreateProductForm({
  canCreate,
  plan,
  productCount,
}: {
  canCreate: boolean;
  plan: OrgPlan;
  productCount: number;
}) {
  const t = useTranslations("products");
  const tip = (key: string) => ({
    title: t(`create.tooltips.${key}.title`),
    body: t(`create.tooltips.${key}.body`),
    reference: t(`create.tooltips.${key}.ref`),
  });
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    createProduct,
    undefined
  );
  const [startAssessment, setStartAssessment] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (state?.productId) {
      if (startAssessment) {
        router.push(`/app/products/${state.productId}/assess`);
      } else {
        router.push(`/app/products/${state.productId}`);
      }
    }
  }, [state, router, startAssessment]);

  // --------------------------------------------------------------------
  // Plan-limit state — reached the product cap.
  // --------------------------------------------------------------------
  if (!canCreate) {
    const limit = PLAN_PRODUCT_LIMITS[plan];
    const nextPlan =
      plan === "free"
        ? "professional"
        : plan === "professional"
          ? "business"
          : "enterprise";

    return (
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-tight">
            {t("create.title")}
          </h1>
          <p className="text-p2 text-muted-foreground">
            {t("create.subtitle")}
          </p>
        </header>

        <div className="flex flex-col items-start gap-6 rounded-md bg-muted p-8">
          {/* Usage ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-border"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${(productCount / limit) * 97.4} 97.4`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute text-l6-plus tabular-nums">
                {productCount}/{limit}
              </span>
            </div>
            <div>
              <h2 className="text-h3 text-foreground">
                {t("limits.reached")}
              </h2>
              <p className="mt-1 text-p3 text-muted-foreground">
                {limit === 1
                  ? t("limits.reachedDescription", {
                      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                      limit,
                    })
                  : t("limits.reachedDescriptionPlural", {
                      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                      limit,
                    })}
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-card border border-border-outline p-4">
              <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                {t("limits.currentPlan")}
              </p>
              <p className="mt-1 text-l5 text-foreground capitalize">{plan}</p>
              <p className="mt-2 text-p4 text-muted-foreground">
                {t(`limits.planFeatures.${plan}`)}
              </p>
            </div>
            <div className="rounded-md bg-primary/5 p-4 border-[1.5px] border-primary/40">
              <p className="text-l6-plus uppercase tracking-wider text-primary">
                Recommended
              </p>
              <p className="mt-1 text-l5 text-foreground capitalize">
                {nextPlan}
              </p>
              <p className="mt-2 text-p4 text-muted-foreground">
                {t(`limits.planFeatures.${nextPlan}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/products"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("limits.backToProducts")}
            </Link>
            <Link
              href="/app/settings/billing"
              className={buttonVariants({ size: "sm" })}
            >
              {t("limits.upgrade")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Create form.
  // --------------------------------------------------------------------

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}`)
      ? t(`errors.${state.error}`)
      : t("errors.generic")
    : null;

  function handleSubmit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-10"
    >
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-tight">
          {t("create.title")}
        </h1>
        <p className="text-p2 text-muted-foreground">
          {t("create.subtitle")}
        </p>
      </header>

      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-p3 text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label size="lg" htmlFor="name">
          {t("create.nameLabel")}
          <FieldHelp {...tip("name")} />
        </Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("create.namePlaceholder")}
          className="h-11"
        />
      </div>

      {/* Type — segmented pills without icons */}
      <div className="flex flex-col gap-2">
        <Label size="lg">
          {t("create.typeLabel")}
          <FieldHelp {...tip("type")} />
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRODUCT_TYPES.map((type) => {
            const active = selectedType === type;
            return (
              <label
                key={type}
                className={cn(
                  "relative flex cursor-pointer items-center justify-center rounded-md px-3 py-3 text-l6 transition",
                  active
                    ? "bg-primary/15 text-primary border-[1.5px] border-primary/40"
                    : "bg-card border-[1.5px] border-border-outline text-muted-foreground hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  required
                  className="sr-only"
                  checked={active}
                  onChange={() => setSelectedType(type)}
                />
                {t(`types.${type}`)}
              </label>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label size="lg" htmlFor="description">
          {t("create.descriptionLabel")}
          <FieldHelp {...tip("description")} />
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder={t("create.descriptionPlaceholder")}
          className="resize-none"
        />
      </div>

      {/* Image — compact, borderless, optional */}
      <div className="flex flex-col gap-2">
        <Label size="lg">
          {t("create.imageLabel")}
          <FieldHelp {...tip("image")} />
        </Label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Product preview"
                className="size-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                aria-label={t("create.imageRemove")}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-card shadow-card-sm text-muted-foreground border border-border-outline transition hover:bg-destructive hover:text-white hover:border-destructive"
              >
                <Icon
                  name="CloseCircle"
                  size={14}
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-20 items-center justify-center rounded-md bg-muted text-l6-plus text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            >
              {t("create.imageUpload")}
            </button>
          )}
          <p className="text-p4 text-muted-foreground">
            {t("create.imageHint")}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Start-assessment — inline row, no card */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={startAssessment}
          onChange={(e) => setStartAssessment(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <div>
          <span className="text-l6 text-foreground">
            {t("create.startAssessment")}
          </span>
          <p className="mt-0.5 text-p4 text-muted-foreground">
            {t("create.startAssessmentDescription")}
          </p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/app/products"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("create.cancel")}
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("create.submitting") : t("create.submit")}
        </Button>
      </div>
    </form>
  );
}
