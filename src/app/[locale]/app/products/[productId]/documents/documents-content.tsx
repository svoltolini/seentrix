"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import {
  saveDocument,
  listDocuments,
  generateDocumentPdf,
  downloadDocumentPdf,
  type DocumentRecord,
  type DocumentType,
  type DocumentStatus,
} from "./actions";
import { DocumentForm, DOC_FIELDS } from "./document-form";

// ---------------------------------------------------------------------------
// Document type config — Nask design language.
//
// Previously each document type was rendered as a gradient card with
// white text (purple → orange, red → orange → blue, etc.). The design
// memory rule is "palette only, no per-card gradients", so the type
// signal moved into a tinted icon block on a plain white card, mirroring
// the products list type tones. The full card stays neutral; only the
// 40 px icon square carries the tone.
// ---------------------------------------------------------------------------

const DOCUMENT_TYPES: {
  type: DocumentType;
  iconName: string;
  tone: { bg: string; fg: string };
}[] = [
  {
    type: "declaration_of_conformity",
    iconName: "checkmark-badge-01-stroke-rounded",
    tone: { bg: "bg-primary/10", fg: "text-primary" },
  },
  {
    type: "vulnerability_disclosure_policy",
    iconName: "shield-check",
    tone: { bg: "bg-accent/10", fg: "text-accent" },
  },
  {
    type: "incident_report",
    iconName: "alert-02",
    tone: { bg: "bg-destructive/10", fg: "text-destructive" },
  },
  {
    type: "technical_documentation",
    iconName: "package-open-stroke-rounded",
    tone: { bg: "bg-success/10", fg: "text-success" },
  },
];

// Status dot tones — palette tokens, used on both the grid card and
// the in-progress editor header.
const STATUS_DOT: Record<DocumentStatus, string> = {
  not_started: "bg-muted-foreground/40",
  draft: "bg-warning",
  final: "bg-success",
};

// Tier-tinted status chip used in the editor header. Same recipe as
// the CRA criticality chip on the products list table — palette
// tokens for both background and text, no gradients, no per-status
// custom hex.
const STATUS_CHIP: Record<DocumentStatus, { bg: string; text: string }> = {
  not_started: {
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  draft: { bg: "bg-warning/10", text: "text-warning" },
  final: { bg: "bg-success/10", text: "text-success" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCompletionPercent(
  type: DocumentType,
  content: string | null
): number {
  if (!content) return 0;
  const fields = DOC_FIELDS[type];
  if (!fields || fields.length === 0) return 0;
  try {
    const data = JSON.parse(content) as Record<string, string>;
    const filled = fields.filter(
      (f) => (data[f.key] ?? "").trim().length > 0
    ).length;
    return Math.round((filled / fields.length) * 100);
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DocumentsContent({
  productId,
  initialDocuments,
}: {
  productId: string;
  initialDocuments: DocumentRecord[];
}) {
  const t = useTranslations("documents");
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const docMap = new Map<DocumentType, DocumentRecord>();
  for (const doc of documents) {
    docMap.set(doc.document_type as DocumentType, doc);
  }

  const refresh = useCallback(async () => {
    const { documents: refreshed } = await listDocuments(productId);
    setDocuments(refreshed);
  }, [productId]);

  function getStatus(type: DocumentType): DocumentStatus {
    return docMap.get(type)?.status ?? "not_started";
  }

  function getStatusLabel(status: DocumentStatus): string {
    if (status === "not_started") return t("grid.statusNotStarted");
    if (status === "draft") return t("grid.statusDraft");
    return t("grid.statusFinal");
  }

  async function handleSave(
    type: DocumentType,
    formData: Record<string, string>
  ) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const title = t(`types.${type}.title`);
    const content = JSON.stringify(formData);

    const result = await saveDocument(
      productId,
      type,
      title,
      content,
      "draft"
    );

    if (result.error) {
      const errorKey = `editor.errors.${result.error}`;
      setSaveError(t.has(errorKey) ? t(errorKey) : t("editor.errors.generic"));
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaveSuccess(true);
    await refresh();
    router.refresh();

    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleGeneratePdf(docId: string) {
    setGeneratingPdf(true);
    setPdfError(null);
    setPdfSuccess(false);

    const result = await generateDocumentPdf(docId);

    if (result.error) {
      const errorKey = `editor.errors.${result.error}`;
      setPdfError(t.has(errorKey) ? t(errorKey) : t("editor.errors.generic"));
      setGeneratingPdf(false);
      return;
    }

    setGeneratingPdf(false);
    setPdfSuccess(true);
    await refresh();

    if (result.url) {
      window.open(result.url, "_blank");
    }

    setTimeout(() => setPdfSuccess(false), 3000);
  }

  async function handleDownloadPdf(docId: string) {
    const result = await downloadDocumentPdf(docId);

    if (result.error) {
      const errorKey = `editor.errors.${result.error}`;
      setPdfError(t.has(errorKey) ? t(errorKey) : t("editor.errors.generic"));
      return;
    }

    if (result.url) {
      window.open(result.url, "_blank");
    }
  }

  function getFormData(type: DocumentType): Record<string, string> {
    const doc = docMap.get(type);
    if (!doc?.content) return {};
    try {
      return JSON.parse(doc.content) as Record<string, string>;
    } catch {
      return {};
    }
  }

  // ------- Editor view -------
  if (editingType) {
    const doc = docMap.get(editingType);
    const status = getStatus(editingType);

    const statusChip = STATUS_CHIP[status];
    return (
      <div className="space-y-6">
        {/* Editor header — breadcrumb back button on top, then a row
            carrying the document title (text-h2) and a tier-tinted
            status chip side-by-side. Replaces an earlier layout that
            crammed a circular back arrow, the title, a status dot and
            label all into one row — readable but visually noisy and
            the status came across as a sub-line of the title rather
            than a discrete piece of metadata. */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setEditingType(null);
              setSaveError(null);
              setSaveSuccess(false);
            }}
            className="inline-flex items-center gap-1.5 text-p3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            <Icon name="ArrowLeft2" size={14} />
            {t.has("editor.back") ? t("editor.back") : "Back to Documents"}
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h2 text-foreground">
              {t(`types.${editingType}.title`)}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-l6-plus uppercase tracking-wider",
                statusChip.bg,
                statusChip.text,
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
              />
              {getStatusLabel(status)}
            </span>
          </div>

          <p className="max-w-3xl text-p2-r leading-relaxed text-muted-foreground">
            {t(`types.${editingType}.description`)}
          </p>
        </div>

        {/* Form */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="p-6">
            <DocumentForm
              documentType={editingType}
              initialData={getFormData(editingType)}
              onSave={(formData) => handleSave(editingType, formData)}
              saving={saving}
            />
          </div>
        </div>

        {/* Actions */}
        {doc && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-5 py-4">
            {doc.retention_until && status === "final" && (
              <span className="inline-flex items-center rounded-sm bg-primary/10 px-2.5 py-1 text-l6-plus uppercase tracking-wider text-primary">
                {t.has("editor.retainedUntil")
                  ? t("editor.retainedUntil", {
                      date: new Date(doc.retention_until).toLocaleDateString(),
                    })
                  : `Retained until ${new Date(doc.retention_until).toLocaleDateString()}`}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGeneratePdf(doc.id)}
              disabled={generatingPdf}
              className="gap-1.5"
            >
              <Icon name="pdf-01-stroke-rounded" size={14} />
              {generatingPdf
                ? t("editor.generatingPdf")
                : t("editor.generatePdf")}
            </Button>

            {doc.file_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(doc.id)}
                className="gap-1.5"
              >
                <Icon name="pdf-01-stroke-rounded" size={14} />
                {t("editor.downloadPdf")}
              </Button>
            )}

            {status === "draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { updateDocumentStatus } = await import("./actions");
                  await updateDocumentStatus(doc.id, "final");
                  await refresh();
                  router.refresh();
                }}
                className="gap-1.5"
              >
                <Icon
                  name="checkmark-badge-01-stroke-rounded"
                  size={14}
                />
                {t("editor.markFinal")}
              </Button>
            )}

            {status === "final" && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { updateDocumentStatus } = await import("./actions");
                  await updateDocumentStatus(doc.id, "draft");
                  await refresh();
                  router.refresh();
                }}
                className="gap-1.5"
              >
                {t("editor.markDraft")}
              </Button>
            )}
          </div>
        )}

        {/* Feedback */}
        {(saveSuccess || saveError || pdfSuccess || pdfError) && (
          <div className="flex flex-col gap-2">
            {saveSuccess && (
              <p className="rounded-md bg-success/10 px-3 py-2 text-p3 text-success">
                {t("editor.saved")}
              </p>
            )}
            {saveError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-p3 text-destructive">
                {saveError}
              </p>
            )}
            {pdfSuccess && (
              <p className="rounded-md bg-success/10 px-3 py-2 text-p3 text-success">
                {t("editor.pdfGenerated")}
              </p>
            )}
            {pdfError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-p3 text-destructive">
                {pdfError}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ------- Grid view -------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-h3 text-foreground">{t("title")}</h2>
        <p className="mt-0.5 text-p3 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Document cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_TYPES.map((config) => {
          const doc = docMap.get(config.type);
          const status = getStatus(config.type);
          const completion = getCompletionPercent(
            config.type,
            doc?.content ?? null
          );

          return (
            <button
              key={config.type}
              type="button"
              onClick={() => setEditingType(config.type)}
              className="group/doc-card text-left"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                {/* Header: tinted icon + title + status */}
                <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      config.tone.bg,
                      config.tone.fg,
                    )}
                  >
                    <Icon name={config.iconName} size={18} variant="Bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h6 text-foreground transition-colors group-hover/doc-card:text-primary">
                      {t(`types.${config.type}.title`)}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          STATUS_DOT[status],
                        )}
                      />
                      <span className="text-p4 text-muted-foreground">
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 px-5 pb-4">
                  <p className="text-p3 leading-relaxed text-muted-foreground">
                    {t(`types.${config.type}.description`)}
                  </p>
                </div>

                {/* Progress bar + last updated — slim 1.5 px orange
                    accent, matches the products list + dashboard. */}
                <div className="border-t border-border px-5 py-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-xl bg-border">
                    <div
                      className="h-full rounded-xl bg-accent transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <span className="mt-2 block text-p4 text-muted-foreground">
                    {doc
                      ? t("grid.lastUpdated", {
                          date: new Date(
                            doc.updated_at
                          ).toLocaleDateString("en-US"),
                        })
                      : t("grid.neverEdited")}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
