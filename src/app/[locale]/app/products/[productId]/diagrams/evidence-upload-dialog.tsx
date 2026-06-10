"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANNEX_VII_POINTS,
  EVIDENCE_CATEGORIES,
  EVIDENCE_MAX_BYTES,
  type EvidenceCategory,
} from "./constants";
import { uploadEvidence } from "./actions";

const NO_ANNEX = "__none__";

export function EvidenceUploadDialog({
  productId,
  open,
  onOpenChange,
  onUploaded,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}) {
  const t = useTranslations("diagrams");
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EvidenceCategory>("test_report");
  const [annexPoint, setAnnexPoint] = useState<string>(NO_ANNEX);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setTitle("");
    setCategory("test_report");
    setAnnexPoint(NO_ANNEX);
    setError(null);
    setUploading(false);
  }

  function pickFile(f: File) {
    setError(null);
    if (f.size > EVIDENCE_MAX_BYTES) {
      setError(t("evidence.errors.fileTooLarge"));
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name);
  }

  async function handleSubmit() {
    if (!file) {
      setError(t("evidence.errors.noFile"));
      return;
    }
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim() || file.name);
    formData.set("category", category);
    if (annexPoint !== NO_ANNEX) formData.set("annexPoint", annexPoint);

    const result = await uploadEvidence(productId, formData);
    setUploading(false);
    if (result.error) {
      const key = `evidence.errors.${result.error}`;
      setError(t.has(key) ? t(key) : t("evidence.errors.generic"));
      return;
    }
    reset();
    onUploaded();
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-150",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-[18px] shadow-card-md transition duration-200",
            "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-h4 text-foreground">
              {t("evidence.addTitle")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
              <Icon name="XIcon" />
              <span className="sr-only">{t("evidence.cancel")}</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="mt-2 text-p3 text-muted-foreground">
            {t("evidence.addDescription")}
          </DialogPrimitive.Description>

          <div className="mt-4 space-y-4">
            {/* Dropzone */}
            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) pickFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed px-6 py-8 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10",
              )}
            >
              <IconBadge name="DocumentUpload" tone="primary" size="lg" />
              {file ? (
                <p className="text-l5 text-foreground">{file.name}</p>
              ) : (
                <>
                  <p className="text-l5 text-foreground">
                    {t("evidence.dropzone")}
                  </p>
                  <p className="text-p4 text-muted-foreground">
                    {t("evidence.dropzoneHint")}
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              />
            </button>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="evidence-title">{t("evidence.titleLabel")}</Label>
              <Input
                id="evidence-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("evidence.titlePlaceholder")}
              />
            </div>

            {/* Category + Annex point */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("evidence.categoryLabel")}</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as EvidenceCategory)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue>
                      {(v) => (v ? t(`evidence.categories.${v}`) : "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`evidence.categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("evidence.annexLabel")}</Label>
                <Select
                  value={annexPoint}
                  onValueChange={(v) => setAnnexPoint(String(v))}
                >
                  <SelectTrigger size="sm">
                    <SelectValue>
                      {(v) =>
                        !v || v === NO_ANNEX
                          ? t("evidence.annexNone")
                          : t("evidence.annexPoint", { point: String(v) })
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_ANNEX}>
                      {t("evidence.annexNone")}
                    </SelectItem>
                    {ANNEX_VII_POINTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t("evidence.annexPoint", { point: p })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-p3 text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close render={<Button variant="outline" size="sm" />}>
              {t("evidence.cancel")}
            </DialogPrimitive.Close>
            <Button size="sm" onClick={handleSubmit} disabled={uploading || !file}>
              {uploading ? t("evidence.uploading") : t("evidence.submit")}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
