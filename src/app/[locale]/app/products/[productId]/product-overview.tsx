"use client";

import { useState, useActionState, useTransition, useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  updateProduct,
  deleteProduct,
  type ProductDetail,
  type ProductActionState,
} from "../actions";
import { PRODUCT_TYPES } from "./constants";
import { FieldHelp } from "@/components/field-help";

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  hardware: { bg: "bg-primary/10", text: "text-primary" },
  software: { bg: "bg-accent/10", text: "text-accent" },
  firmware: { bg: "bg-success/10", text: "text-success" },
  iot: { bg: "bg-warning/10", text: "text-warning" },
};

// CRA categories form an escalating risk hierarchy. Tier-tinted chip
// recipe matches the criticality meter on the products list table so
// the badge looks identical across surfaces.
const CRA_TIER_TONE: Record<string, { bg: string; text: string }> = {
  default: { bg: "bg-primary/10", text: "text-primary" },
  important_class_i: { bg: "bg-warning/10", text: "text-warning" },
  important_class_ii: { bg: "bg-accent/10", text: "text-accent" },
  critical: { bg: "bg-destructive/10", text: "text-destructive" },
};

const EM_DASH = "—";

// === Stat card =========================================================
// Minimal Nask card used by the four metrics on the product overview.
// White surface, soft shadow, eyebrow above value. No gradients, no
// per-tier background tints — those were retired with the design
// memory rule "palette only".

function StatCard({
  eyebrow,
  children,
  footer,
}: {
  eyebrow: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-md bg-card p-5 shadow-card-md">
      <div className="flex flex-col gap-2">
        <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <div>{children}</div>
      </div>
      {footer && <div>{footer}</div>}
    </div>
  );
}

export function ProductOverview({
  product,
  complianceScore,
  hasChecklist,
}: {
  product: ProductDetail;
  complianceScore: number;
  hasChecklist: boolean;
}) {
  const t = useTranslations("products");
  const tAssessment = useTranslations("assessment");
  const tip = (key: string) => ({
    title: t(`create.tooltips.${key}.title`),
    body: t(`create.tooltips.${key}.body`),
    reference: t(`create.tooltips.${key}.ref`),
  });
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetImageState() {
    setImagePreview(product.image_url);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const boundUpdate = updateProduct.bind(null, product.id);
  const [editState, editAction] = useActionState<ProductActionState, FormData>(
    boundUpdate,
    undefined
  );

  // React to the server action completing: close the editor, clear the
  // staged image, and refresh. The setState runs only on a successful
  // submit (when `editState.productId` is populated), not on every render,
  // so the cascading-render concern behind the lint rule does not apply.
  // `resetImageState` is a stable local helper; intentionally omitted from
  // deps to avoid re-running on every render. (set-state-in-effect /
  // exhaustive-deps disabled for this file via eslint.config.mjs — the
  // React-Compiler rule's inline directives are not honored reliably here.)
  useEffect(() => {
    if (editState?.productId) {
      setEditing(false);
      resetImageState();
      router.refresh();
    }
  }, [editState, router]);

  function handleEdit(formData: FormData) {
    startTransition(() => editAction(formData));
  }

  async function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result?.error) {
        router.push("/app/products");
      }
    });
  }

  const ts = TYPE_STYLE[product.type ?? ""] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
  };
  const craTone = product.cra_category
    ? (CRA_TIER_TONE[product.cra_category] ?? CRA_TIER_TONE.default)
    : { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <div className="space-y-6">
      {/* Stat cards — four white panels with `shadow-card-md` and a
          tier-tinted chip per stat. Replaces an earlier per-card
          gradient layout (purple/orange/green/blue tints assembled
          per CRA category) which contradicted the design memory rule
          "palette only, no per-card gradients" and felt like a
          different system from the dashboard. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Type */}
        <StatCard eyebrow={t("detail.overview.type")}>
          {product.type ? (
            <span
              className={`inline-flex rounded-sm px-2.5 py-0.5 text-l6-plus uppercase tracking-wider ${ts.bg} ${ts.text}`}
            >
              {t(`types.${product.type}`)}
            </span>
          ) : (
            <span className="text-p3 text-muted-foreground">{EM_DASH}</span>
          )}
        </StatCard>

        {/* CRA Category */}
        <StatCard eyebrow={t("detail.overview.craStatus")}>
          {product.cra_category ? (
            <span
              className={`inline-flex rounded-sm px-2.5 py-0.5 text-l6-plus uppercase tracking-wider ${craTone.bg} ${craTone.text}`}
            >
              {t(`categories.${product.cra_category}`)}
            </span>
          ) : (
            <Link
              href={`/app/products/${product.id}/assess`}
              className="inline-flex items-center gap-1 text-l6 text-primary hover:underline"
            >
              {t("detail.overview.runAssessment")} &rarr;
            </Link>
          )}
        </StatCard>

        {/* Compliance */}
        <StatCard
          eyebrow={t("detail.overview.complianceScore")}
          footer={
            hasChecklist ? (
              <div className="h-1.5 overflow-hidden rounded-xl bg-border">
                <div
                  className="h-full rounded-xl bg-accent transition-[width] duration-500"
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
            ) : undefined
          }
        >
          <p className="text-h2 tabular-nums tracking-tight text-foreground">
            {hasChecklist ? `${complianceScore}%` : EM_DASH}
          </p>
        </StatCard>

        {/* Conformity Route */}
        <StatCard
          eyebrow={t("detail.overview.conformityRoute")}
          footer={
            product.requires_notified_body ? (
              <p className="text-p4 text-muted-foreground">
                {t("detail.overview.notifiedBody")}:{" "}
                <span className="text-foreground">
                  {t("detail.overview.yes")}
                </span>
              </p>
            ) : undefined
          }
        >
          {product.conformity_route ? (
            <p className="text-h5 text-foreground">
              {tAssessment(`result.routes.${product.conformity_route}`)}
            </p>
          ) : (
            <span className="text-p3 text-muted-foreground">{EM_DASH}</span>
          )}
        </StatCard>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2">
        {product.cra_category && (
          <Link
            href={`/app/products/${product.id}/assess`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("detail.assessment.rerun")}
          </Link>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
          className="gap-1.5"
        >
          <Icon name="PencilIcon" className="size-3.5" />
          {t("detail.overview.edit")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDelete(true)}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Icon name="Trash2Icon" className="size-3.5" />
          {t("detail.overview.delete")}
        </Button>
      </div>

      {/* Edit sheet */}
      <Sheet open={editing} onOpenChange={(open) => { setEditing(open); if (!open) resetImageState(); }}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{t("edit.title")}</SheetTitle>
            <SheetDescription>{t("detail.overview.edit")}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <form action={handleEdit} className="flex flex-col gap-5">
              {editState?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-p3 text-destructive">
                  {t.has(`errors.${editState.error}`)
                    ? t(`errors.${editState.error}`)
                    : t("errors.generic")}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-name">
                  {t("create.nameLabel")}
                  <FieldHelp {...tip("name")} />
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={product.name}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  {t("create.typeLabel")}
                  <FieldHelp {...tip("type")} />
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCT_TYPES.map((type) => {
                    const typeStyle = TYPE_STYLE[type] ?? {
                      bg: "bg-muted",
                      text: "text-muted-foreground",
                    };
                    return (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md border-[1.5px] border-border-outline bg-card px-3 py-2.5 text-p3 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          defaultChecked={product.type === type}
                          className="sr-only"
                        />
                        <div
                          className={`flex size-6 shrink-0 items-center justify-center rounded-sm text-l6-plus ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {type[0].toUpperCase()}
                        </div>
                        <span className="text-l6">{t(`types.${type}`)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-desc">
                  {t("create.descriptionLabel")}
                  <FieldHelp {...tip("description")} />
                </Label>
                <Textarea
                  id="edit-desc"
                  name="description"
                  rows={3}
                  defaultValue={product.description ?? ""}
                />
              </div>

              {/* Product image */}
              <div className="flex flex-col gap-2">
                <Label>
                  {t("create.imageLabel")}
                  <FieldHelp {...tip("image")} />
                </Label>
                <input type="hidden" name="remove_image" value={removeImage ? "1" : "0"} />
                {imagePreview ? (
                  <div className="relative w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Product"
                      className="size-24 rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-card shadow-card-sm text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                    >
                      <Icon name="XIcon" className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-outline bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="ImageIcon" className="size-5" />
                    <span className="text-l6-plus">
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
                <p className="text-p4 text-muted-foreground">
                  {t("create.imageHint")}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(false); resetImageState(); }}
                >
                  {t("edit.cancel")}
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {t("edit.submit")}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={t("delete.title")}
        description={t("delete.description", { name: product.name })}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("delete.cancel")}
        onConfirm={handleDelete}
        disabled={isPending}
      />
    </div>
  );
}
