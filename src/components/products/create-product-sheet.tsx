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
import { IconBadge } from "@/components/ui/icon-badge";
import { FieldHelp } from "@/components/field-help";
import {
  SideSheetBackdrop,
  SideSheetBody,
  SideSheetFooter,
  SideSheetHero,
  SideSheetPopup,
} from "@/components/side-sheet";
import { PLAN_PRODUCT_LIMITS, type OrgPlan } from "@/lib/constants/plans";
import { cn } from "@/lib/utils";
import {
  CreateProductContext,
  type CreateProductContextValue,
} from "./create-product-context";
import { useCallback, useMemo } from "react";

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

export function CreateProductSheet({
  children,
}: {
  children?: React.ReactNode;
}) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Open state is owned locally so triggers can open the sheet INSTANTLY via
  // React state instead of a route navigation (which was the source of the
  // glitchy lag). The `?new=product` deep-link is mirrored into this state by
  // the effect below.
  const [isOpen, setIsOpen] = useState(false);
  const [orgInfo, setOrgInfo] = useState<SheetState>({ kind: "loading" });
  const deepLink = searchParams?.get("new") === "product";

  // Prefetch the org's plan info ONCE on mount (not on open) so the form is
  // already "ready" the instant the sheet appears — no Loading flash, no jank.
  useEffect(() => {
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
  }, []);

  // Honour the `?new=product` deep-link: open the sheet and strip the param so
  // the URL doesn't keep the sheet "sticky" on refresh/close.
  useEffect(() => {
    if (!deepLink) return;
    setIsOpen(true);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("new");
    const q = params.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  function handleOpenChange(next: boolean) {
    setIsOpen(next);
  }

  const ctx: CreateProductContextValue = useMemo(
    () => ({ isOpen, open, close }),
    [isOpen, open, close],
  );

  return (
    <CreateProductContext.Provider value={ctx}>
      {children}
      <SheetPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <SheetPrimitive.Portal>
        <SideSheetBackdrop />
        <SideSheetPopup data-slot="create-product-sheet">
          <SideSheetHero
            eyebrow={
              t.has("create.eyebrow") ? t("create.eyebrow") : "New product"
            }
            title={
              t.has("create.sheetTitle")
                ? t("create.sheetTitle")
                : t("create.title")
            }
            description={t("create.subtitle")}
          />

          {orgInfo.kind === "loading" && (
            <SideSheetBody className="flex items-center justify-center text-p3 text-muted-foreground">
              {t.has("create.loading") ? t("create.loading") : "Loading…"}
            </SideSheetBody>
          )}

          {orgInfo.kind === "error" && (
            <SideSheetBody className="flex items-center justify-center text-center text-p3 text-destructive">
              {t.has("errors.generic")
                ? t("errors.generic")
                : "Something went wrong."}
            </SideSheetBody>
          )}

          {orgInfo.kind === "ready" && !orgInfo.canCreate && (
            <PlanLimitBody
              plan={orgInfo.plan}
              productCount={orgInfo.productCount}
              onClose={close}
            />
          )}

          {orgInfo.kind === "ready" && orgInfo.canCreate && (
            <CreateFormBody onClose={close} />
          )}
        </SideSheetPopup>
      </SheetPrimitive.Portal>
      </SheetPrimitive.Root>
    </CreateProductContext.Provider>
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
      <SideSheetBody>
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

        {/* Type — 4 segmented pills, all on one row (the wider sheet fits them). */}
        <div className="flex flex-col gap-2">
          <Label>
            {t("create.typeLabel")}
            <FieldHelp {...tip("type")} />
          </Label>
          <div className="grid grid-cols-4 gap-2">
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
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border-outline bg-card text-muted-foreground shadow-card-sm transition hover:border-destructive hover:bg-destructive hover:text-primary-foreground"
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

        {/* Start-assessment toggle — a richer selectable card: an IconBadge,
            title + description, and a switch-style affordance. Selecting it
            highlights the whole card so it reads as a deliberate choice. */}
        <label
          className={cn(
            "group flex cursor-pointer items-start gap-3.5 rounded-md border-[1.5px] p-4 transition",
            startAssessment
              ? "border-primary/40 bg-primary/5"
              : "border-border-outline bg-card hover:border-primary/25",
          )}
        >
          <input
            type="checkbox"
            checked={startAssessment}
            onChange={(e) => setStartAssessment(e.target.checked)}
            className="sr-only"
          />
          <IconBadge name="ShieldTick" tone="primary" size="lg" />
          <div className="min-w-0 flex-1">
            <span className="text-l5 text-foreground">
              {t("create.startAssessment")}
            </span>
            <p className="mt-1 text-p4 leading-relaxed text-muted-foreground">
              {t("create.startAssessmentDescription")}
            </p>
          </div>
          {/* Switch-style indicator. */}
          <span
            className={cn(
              "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
              startAssessment ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-primary-foreground shadow-sm transition",
                startAssessment ? "translate-x-4" : "translate-x-0",
              )}
            />
          </span>
        </label>
      </SideSheetBody>

      <SideSheetFooter>
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? t("create.submitting") : t("create.submit")}
        </Button>
      </SideSheetFooter>
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
    <>
      <SideSheetBody>
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
      </SideSheetBody>

      <SideSheetFooter>
        <div className="flex items-center justify-end gap-2">
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
      </SideSheetFooter>
    </>
  );
}
