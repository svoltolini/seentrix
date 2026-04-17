"use client";

import { useActionState, useTransition, useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, type ProductActionState } from "../actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRODUCT_LIMITS } from "@/lib/constants/plans";
import { HugeIcon } from "@/components/huge-icon";
import { ImageIcon, XIcon } from "lucide-react";

const PRODUCT_TYPES = ["hardware", "software", "firmware", "iot"] as const;

const TYPE_ICON: Record<string, { bg: string; text: string }> = {
  hardware: { bg: "bg-[#2563EB]/15", text: "text-[#2563EB]" },
  software: { bg: "bg-[#7C3AED]/15", text: "text-[#7C3AED]" },
  firmware: { bg: "bg-[#EA580C]/15", text: "text-[#EA580C]" },
  iot: { bg: "bg-[#0891B2]/15", text: "text-[#0891B2]" },
};

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    createProduct,
    undefined
  );
  const [startAssessment, setStartAssessment] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Plan limit reached
  if (!canCreate) {
    const limit = PLAN_PRODUCT_LIMITS[plan];
    const nextPlan =
      plan === "free"
        ? "professional"
        : plan === "professional"
          ? "business"
          : "enterprise";

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight">
            {t("create.title")}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {t("create.subtitle")}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-card">
          <div className="flex flex-col items-center px-6 py-14 text-center">
            {/* Usage ring */}
            <div className="relative mb-5 flex size-20 items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-white/[0.06]"
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
              <span className="absolute text-sm font-bold tabular-nums">
                {productCount}/{limit}
              </span>
            </div>

            <h2 className="text-lg font-semibold">{t("limits.reached")}</h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
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

            {/* Plan comparison */}
            <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-4 text-left">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  {t("limits.currentPlan")}
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {plan}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t(`limits.planFeatures.${plan}`)}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
                  Recommended
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {nextPlan}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t(`limits.planFeatures.${nextPlan}`)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/app/products"
                className={buttonVariants({ variant: "outline", size: "sm" })}
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
      </div>
    );
  }

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}`)
      ? t(`errors.${state.error}`)
      : t("errors.generic")
    : null;

  function handleSubmit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          {t("create.title")}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {t("create.subtitle")}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-card">
        <form action={handleSubmit} className="flex flex-col gap-6 p-6">
          {errorMessage && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("create.nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder={t("create.namePlaceholder")}
            />
          </div>

          {/* Type selection */}
          <div className="flex flex-col gap-2">
            <Label>{t("create.typeLabel")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_TYPES.map((type) => {
                const ts = TYPE_ICON[type];
                return (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 transition-all has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      required
                      className="sr-only"
                    />
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${ts.bg} ${ts.text}`}
                    >
                      {type[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">
                      {t(`types.${type}`)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("create.descriptionLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder={t("create.descriptionPlaceholder")}
            />
          </div>

          {/* Product image */}
          <div className="flex flex-col gap-2">
            <Label>{t("create.imageLabel")}</Label>
            {imagePreview ? (
              <div className="relative w-fit">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="size-24 rounded-xl border border-white/[0.06] object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] text-muted-foreground/40 transition-colors hover:border-white/[0.15] hover:text-muted-foreground/60"
              >
                <ImageIcon className="size-5" />
                <span className="text-[10px] font-medium">
                  {t("create.imageUpload")}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-[11px] text-muted-foreground/40">
              {t("create.imageHint")}
            </p>
          </div>

          {/* Start assessment checkbox */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] px-4 py-3.5 transition-all has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
            <input
              type="checkbox"
              checked={startAssessment}
              onChange={(e) => setStartAssessment(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <div>
              <span className="text-sm font-medium">
                {t("create.startAssessment")}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("create.startAssessmentDescription")}
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/app/products"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("create.cancel")}
            </Link>
            <Button type="submit" size="sm" disabled={isPending}>
              {t("create.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
