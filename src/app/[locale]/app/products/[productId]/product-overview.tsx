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
  hardware: { bg: "bg-primary/15", text: "text-primary" },
  software: { bg: "bg-[#6F4FE0]/15", text: "text-[#6F4FE0]" },
  firmware: { bg: "bg-accent/15", text: "text-accent" },
  iot: { bg: "bg-[#22D3EE]/15", text: "text-[#22D3EE]" },
};

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

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Type — purple */}
        <div
          className="overflow-hidden rounded-md"
          style={{ background: "linear-gradient(135deg, #6F4FE0, #066DE6)" }}
        >
          <div className="p-5">
            <p className="text-l6-plus text-white">
              {t("detail.overview.type")}
            </p>
            <div className="mt-2">
              <span className="inline-block rounded-sm bg-white/20 px-2.5 py-0.5 text-l6-plus text-white">
                {product.type ? t(`types.${product.type}`) : "\u2014"}
              </span>
            </div>
          </div>
        </div>

        {/* CRA Category */}
        <div
          className="overflow-hidden rounded-md"
          style={{
            background: product.cra_category
              ? product.cra_category === "critical"
                ? "linear-gradient(135deg, #E60019, #6F4FE0 60%, #066DE6)"
                : product.cra_category === "important_class_ii"
                  ? "linear-gradient(135deg, #FF6D00, #6F4FE0 60%, #066DE6)"
                  : product.cra_category === "important_class_i"
                    ? "linear-gradient(135deg, #FF9E55, #066DE6)"
                    : "linear-gradient(135deg, #066DE6, #22D3EE)"
              : "linear-gradient(135deg, #2C3659, #4B5670)",
          }}
        >
          <div className="p-5">
            <p className="text-l6-plus text-white">
              {t("detail.overview.craStatus")}
            </p>
            {product.cra_category ? (
              <div className="mt-2">
                <span className="inline-block rounded-sm bg-white/20 px-2.5 py-0.5 text-l6-plus text-white">
                  {t(`categories.${product.cra_category}`)}
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <Link
                  href={`/app/products/${product.id}/assess`}
                  className="text-l6 text-white hover:underline"
                >
                  {t("detail.overview.runAssessment")} &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Compliance — green */}
        <div
          className="overflow-hidden rounded-md"
          style={{
            background: hasChecklist
              ? "linear-gradient(135deg, #4CD964, #16A34A)"
              : "linear-gradient(135deg, #2C3659, #4B5670)",
          }}
        >
          <div className="p-5">
            <p className="text-l6-plus text-white">
              {t("detail.overview.complianceScore")}
            </p>
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-white">
              {hasChecklist ? `${complianceScore}%` : "\u2014"}
            </p>
            {hasChecklist && (
              <div className="mt-2.5 h-3 overflow-hidden rounded-sm bg-white/25">
                <div
                  className="h-full rounded-sm bg-white transition-all duration-500"
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Conformity Route — blue */}
        <div
          className="overflow-hidden rounded-md"
          style={{ background: "linear-gradient(135deg, #066DE6, #22D3EE)" }}
        >
          <div className="p-5">
            <p className="text-l6-plus text-white">
              {t("detail.overview.conformityRoute")}
            </p>
            <p className="mt-2 text-l6 text-white">
              {product.conformity_route
                ? tAssessment(`result.routes.${product.conformity_route}`)
                : "\u2014"}
            </p>
            {product.requires_notified_body && (
              <p className="mt-1 text-p4 text-white">
                {t("detail.overview.notifiedBody")}: {t("detail.overview.yes")}
              </p>
            )}
          </div>
        </div>
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
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
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
