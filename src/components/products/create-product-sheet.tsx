"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import {
  createProduct,
  getOrgProductInfo,
  type ProductActionState,
} from "@/app/[locale]/app/products/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { PLAN_PRODUCT_LIMITS, type OrgPlan } from "@/lib/constants/plans";
import { cn } from "@/lib/utils";

/**
 * CreateProductSheet — the canonical "+ New Product" affordance,
 * matching Figma frame `173:16444` (Create Project sheet).
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ Create Product                          ×    │
 *   ├──────────────────────────────────────────────┤
 *   │ Project Name                                  │
 *   │ [ input ]                                     │
 *   │                                               │
 *   │ Type                                          │
 *   │ [Hardware] [Software] [Firmware] [IoT]        │
 *   │                                               │
 *   │ Description                                   │
 *   │ [ textarea ]                                  │
 *   │                                               │
 *   │ Product Image                                 │
 *   │ [drop zone / preview]                         │
 *   │                                               │
 *   │ ☐  Start CRA assessment after creating        │
 *   ├──────────────────────────────────────────────┤
 *   │           [ Create Product ]                  │
 *   └──────────────────────────────────────────────┘
 *
 * Drives off a URL query param (`?new=product`) so any CTA in the
 * app — sidebar, topbar, empty states — can open the sheet by
 * navigating to the same URL with the param appended. That keeps the
 * trigger logic dead simple (no shared React context, no global
 * store) and means the sheet is deep-linkable.
 *
 * The legacy `/app/products/new` route still works as a fallback for
 * existing deep links; the sheet supersedes it as the primary UX.
 *
 * Plan-limit gating is mirrored from the old full-page form: when the
 * org has hit its plan's product cap, the sheet body switches to a
 * usage ring + upgrade prompt instead of the create form.
 */

type SheetState =
  | { kind: "loading" }
  | {
      kind: "ready";
      canCreate: boolean;
      plan: OrgPlan;
      productCount: number;
    }
  | { kind: "error" };

const PRODUCT_TYPES = ["hardware", "software", "firmware", "iot"] as const;

export function CreateProductSheet() {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isOpen = searchParams?.get("new") === "product";

  const [orgInfo, setOrgInfo] = useState<SheetState>({ kind: "loading" });

  // Lazy-fetch the org's plan info the first time the sheet opens —
  // we don't want to issue a Supabase query on every page mount.
  useEffect(() => {
    if (!isOpen) return;
    if (orgInfo.kind !== "loading") return;
    let cancelled = false;
    (async () => {
      try {
        const info = await getOrgProductInfo();
        if (cancelled) return;
        setOrgInfo({
          kind: "ready",
          canCreate: info.canCreate,
          plan: info.plan,
          productCount: info.productCount,
        });
      } catch {
        if (cancelled) return;
        setOrgInfo({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, orgInfo.kind]);

  function handleOpenChange(next: boolean) {
    if (next) return;
    // Strip the query param to close — keeps deep-linking symmetric
    // (open via ?new=product, close by removing it).
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("new");
    const q = params.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`);
    // Reset state so the next open re-fetches in case plan/count
    // shifted in the meantime (e.g. another tab created a product).
    setOrgInfo({ kind: "loading" });
  }

  return (
    <SheetPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <SheetPrimitive.Popup
          data-slot="create-product-sheet"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-card text-p3 text-card-foreground shadow-card-lg transition duration-200 ease-in-out sm:max-w-md",
            "data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0",
          )}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-6 pb-5 pt-6">
            <div className="flex min-w-0 flex-col gap-1">
              <SheetPrimitive.Title className="text-h3 text-foreground">
                {t.has("create.sheetTitle")
                  ? t("create.sheetTitle")
                  : t("create.title")}
              </SheetPrimitive.Title>
              <SheetPrimitive.Description className="text-p3-r text-muted-foreground">
                {t("create.subtitle")}
              </SheetPrimitive.Description>
            </div>
            <SheetPrimitive.Close
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={
                t.has("create.cancel") ? t("create.cancel") : "Close"
              }
            >
              <Icon name="cancel-circle-half-dot-stroke-rounded" size={18} />
            </SheetPrimitive.Close>
          </div>

          {/* BODY */}
          {orgInfo.kind === "loading" && (
            <div className="flex flex-1 items-center justify-center text-p3 text-muted-foreground">
              {t.has("create.loading") ? t("create.loading") : "Loading…"}
            </div>
          )}

          {orgInfo.kind === "error" && (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-p3 text-destructive">
              {t.has("errors.generic") ? t("errors.generic") : "Something went wrong."}
            </div>
          )}

          {orgInfo.kind === "ready" && !orgInfo.canCreate && (
            <PlanLimitBody
              plan={orgInfo.plan}
              productCount={orgInfo.productCount}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {orgInfo.kind === "ready" && orgInfo.canCreate && (
            <CreateFormBody onClose={() => handleOpenChange(false)} />
          )}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

// === Create form body =================================================
// Wraps the actual form so we can render it conditionally only when
// `canCreate` is true. Otherwise the plan-limit body takes over.

function CreateFormBody({ onClose }: { onClose: () => void }) {
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
    undefined,
  );
  const [startAssessment, setStartAssessment] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (state?.productId) {
      onClose();
      if (startAssessment) {
        router.push(`/app/products/${state.productId}/assess`);
      } else {
        router.push(`/app/products/${state.productId}`);
      }
    }
  }, [state, router, startAssessment, onClose]);

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
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {errorMessage && (
          <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-p3 text-destructive">
            {errorMessage}
          </p>
        )}

        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="create-name">
            {t("create.nameLabel")}
            <FieldHelp {...tip("name")} />
          </Label>
          <Input
            id="create-name"
            name="name"
            required
            placeholder={t("create.namePlaceholder")}
          />
        </div>

        {/* Type — 4 segmented pills */}
        <div className="flex flex-col gap-2">
          <Label>
            {t("create.typeLabel")}
            <FieldHelp {...tip("type")} />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCT_TYPES.map((type) => {
              const active = selectedType === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "relative flex cursor-pointer items-center justify-center rounded-md border-[1.5px] px-3 py-2.5 text-l6 transition",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
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
          <Label htmlFor="create-description">
            {t("create.descriptionLabel")}
            <FieldHelp {...tip("description")} />
          </Label>
          <Textarea
            id="create-description"
            name="description"
            rows={3}
            placeholder={t("create.descriptionPlaceholder")}
            className="resize-none"
          />
        </div>

        {/* Image — compact preview / picker */}
        <div className="flex flex-col gap-2">
          <Label>
            {t("create.imageLabel")}
            <FieldHelp {...tip("image")} />
          </Label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="size-20 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label={t("create.imageRemove")}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border-outline bg-card text-muted-foreground shadow-card-sm transition hover:border-destructive hover:bg-destructive hover:text-white"
                >
                  <Icon name="CloseCircle" size={14} aria-hidden="true" />
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

        {/* Start-assessment toggle */}
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border-outline bg-card p-3">
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
      </div>

      {/* FOOTER — anchored CTA */}
      <div className="border-t border-border bg-card px-6 py-4">
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? t("create.submitting") : t("create.submit")}
        </Button>
      </div>
    </form>
  );
}

// === Plan-limit body ==================================================
// Same usage-ring + upgrade-prompt recipe the legacy full-page form
// used. Re-rendered inside the sheet's body so the user never bounces
// to a separate page just to see "you've hit the cap".

function PlanLimitBody({
  plan,
  productCount,
  onClose,
}: {
  plan: OrgPlan;
  productCount: number;
  onClose: () => void;
}) {
  const t = useTranslations("products");
  const limit = PLAN_PRODUCT_LIMITS[plan];
  const nextPlan =
    plan === "free"
      ? "professional"
      : plan === "professional"
        ? "business"
        : "enterprise";

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="relative flex size-14 items-center justify-center">
          <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
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
          <h2 className="text-h4 text-foreground">{t("limits.reached")}</h2>
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

      <div className="grid gap-3">
        <div className="rounded-md border border-border-outline bg-card p-4">
          <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("limits.currentPlan")}
          </p>
          <p className="mt-1 text-l5 capitalize text-foreground">{plan}</p>
          <p className="mt-2 text-p4 text-muted-foreground">
            {t(`limits.planFeatures.${plan}`)}
          </p>
        </div>
        <div className="rounded-md border-[1.5px] border-primary/40 bg-primary/5 p-4">
          <p className="text-l6-plus uppercase tracking-wider text-primary">
            Recommended
          </p>
          <p className="mt-1 text-l5 capitalize text-foreground">{nextPlan}</p>
          <p className="mt-2 text-p4 text-muted-foreground">
            {t(`limits.planFeatures.${nextPlan}`)}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("limits.backToProducts")}
        </button>
        <Link
          href="/app/settings/billing"
          className={buttonVariants({ size: "sm" })}
          onClick={onClose}
        >
          {t("limits.upgrade")}
        </Link>
      </div>
    </div>
  );
}
