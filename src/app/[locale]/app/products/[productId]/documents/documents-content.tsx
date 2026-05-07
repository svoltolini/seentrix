"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
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
// Document type config
// ---------------------------------------------------------------------------

const DOCUMENT_TYPES: {
  type: DocumentType;
  iconName: string;
  gradient: string;
}[] = [
  {
    type: "declaration_of_conformity",
    iconName: "checkmark-badge-01-stroke-rounded",
    gradient: "linear-gradient(135deg, #066DE6, #22D3EE)",
  },
  {
    type: "vulnerability_disclosure_policy",
    iconName: "shield-check",
    gradient: "linear-gradient(135deg, #6F4FE0, #066DE6)",
  },
  {
    type: "incident_report",
    iconName: "alert-02",
    gradient: "linear-gradient(135deg, #E60019, #6F4FE0 60%, #066DE6)",
  },
  {
    type: "risk_assessment",
    iconName: "alert-02",
    gradient: "linear-gradient(135deg, #FF9E55, #FF6D00)",
  },
  {
    type: "technical_documentation",
    iconName: "package-open-stroke-rounded",
    gradient: "linear-gradient(135deg, #4CD964, #16A34A)",
  },
];

const STATUS_DOT: Record<DocumentStatus, string> = {
  not_started: "bg-white/30",
  draft: "bg-white/60",
  final: "bg-white",
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
  const params = useParams();
  const locale = (params.locale as string) || "en";
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

    const result = await generateDocumentPdf(docId, locale);

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

    return (
      <div className="space-y-6">
        {/* Editor header */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingType(null);
              setSaveError(null);
              setSaveSuccess(false);
            }}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="ChevronLeftIcon" className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-h3 text-foreground">
                {t(`types.${editingType}.title`)}
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    STATUS_DOT[status]
                  )}
                />
                <span className="text-p4 text-muted-foreground">
                  {getStatusLabel(status)}
                </span>
              </div>
            </div>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t(`types.${editingType}.description`)}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-hidden rounded-md bg-card shadow-card-lg">
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
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-card shadow-card-sm px-5 py-4">
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
              className="group text-left"
            >
              <div
                className="flex h-full flex-col overflow-hidden rounded-md transition-all hover:-translate-y-0.5"
                style={{ background: config.gradient }}
              >
                {/* Header: icon + title + status */}
                <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/15">
                    <Icon
                      name={config.iconName}
                      size={18}
                      className="text-white"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h6 text-white">
                      {t(`types.${config.type}.title`)}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          STATUS_DOT[status]
                        )}
                      />
                      <span className="text-p4 text-white">
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 px-5 pb-4">
                  <p className="text-p3 leading-relaxed text-white">
                    {t(`types.${config.type}.description`)}
                  </p>
                </div>

                {/* Progress bar + last updated */}
                <div className="border-t border-black/10 px-5 py-3">
                  <div className="h-3 w-full overflow-hidden rounded-sm bg-white/25">
                    <div
                      className="h-full rounded-sm bg-white transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <span className="mt-1.5 block text-p4 text-white">
                    {doc
                      ? t("grid.lastUpdated", {
                          date: new Date(
                            doc.updated_at
                          ).toLocaleDateString(locale),
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
