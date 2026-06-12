"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon, type IconName } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopilotFabContext } from "@/components/copilot/copilot-fab-context";
import { DiagramEditor, type EditorTarget } from "./diagram-editor";
import { EvidenceUploadDialog } from "./evidence-upload-dialog";
import {
  loadDiagramsAndEvidence,
  renameDiagram,
  deleteDiagram,
  restoreDiagram,
  deleteEvidence,
  getEvidenceDownloadUrl,
  type DiagramRecord,
  type EvidenceRecord,
  type DiagramsState,
} from "./actions";
import {
  DIAGRAM_TYPES,
  type DiagramType,
  type EvidenceCategory,
} from "./constants";

const DIAGRAM_TYPE_ICON: Record<DiagramType, IconName> = {
  architecture: "Category",
  data_flow: "Routing",
  environment: "Global",
  threat_model: "ShieldTick",
  hardware_layout: "Cpu",
};

const EVIDENCE_CATEGORY_ICON: Record<EvidenceCategory, IconName> = {
  test_report: "DocumentText",
  penetration_test: "ShieldTick",
  code_analysis: "Code",
  fuzzing: "Cpu",
  third_party_test: "Verify",
  due_diligence: "Note1",
  hardware_photo: "Image",
  other: "Document",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DiagramsContent({
  productId,
  initial,
  canWrite,
}: {
  productId: string;
  initial: DiagramsState;
  canWrite: boolean;
}) {
  const t = useTranslations("diagrams");
  const router = useRouter();
  const { toast } = useToast();

  const [diagrams, setDiagrams] = useState<DiagramRecord[]>(initial.diagrams);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>(initial.evidence);

  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DiagramRecord | null>(null);
  const [deleteDiagramTarget, setDeleteDiagramTarget] =
    useState<DiagramRecord | null>(null);
  const [deleteEvidenceTarget, setDeleteEvidenceTarget] =
    useState<EvidenceRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const { state } = await loadDiagramsAndEvidence(productId);
    if (state) {
      setDiagrams(state.diagrams);
      setEvidence(state.evidence);
    }
    router.refresh();
  }, [productId, router]);

  // One valid diagram per type: the grid shows the active set; superseded
  // versions live in the archive list below and can be restored.
  const activeDiagrams = diagrams.filter((d) => !d.archived_at);
  const archivedDiagrams = diagrams.filter((d) => d.archived_at);
  const missingTypes = DIAGRAM_TYPES.filter(
    (dt) => !activeDiagrams.some((d) => d.type === dt),
  );


  function handleDownload(record: EvidenceRecord) {
    startTransition(async () => {
      const { url } = await getEvidenceDownloadUrl(record.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  function confirmDeleteDiagram() {
    if (!deleteDiagramTarget) return;
    const id = deleteDiagramTarget.id;
    startTransition(async () => {
      const result = await deleteDiagram(id, productId);
      if (!result.error) {
        setDiagrams((prev) => prev.filter((d) => d.id !== id));
        router.refresh();
      } else {
        toast({
          type: "error",
          message:
            result.error === "inTechnicalFile"
              ? t("diagrams.deleteBlocked")
              : t("diagrams.deleteFailed"),
        });
      }
      setDeleteDiagramTarget(null);
    });
  }

  function confirmDeleteEvidence() {
    if (!deleteEvidenceTarget) return;
    const id = deleteEvidenceTarget.id;
    startTransition(async () => {
      const result = await deleteEvidence(id, productId);
      if (!result.error) {
        setEvidence((prev) => prev.filter((e) => e.id !== id));
        router.refresh();
      }
      setDeleteEvidenceTarget(null);
    });
  }

  return (
    <div className="space-y-10">
      {/* Screen-contextual Copilot FAB topic. */}
      <CopilotFabContext
        topicKey="diagrams"
        seed="What architecture and data-flow diagrams does the CRA expect in my Annex VII technical file, and what counts as test-report evidence?"
      />

      {/* ----------------------------------------------------------------- */}
      {/* Diagrams                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-h3 text-foreground">{t("diagrams.title")}</h2>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            {t("diagrams.subtitle")}
          </p>
        </div>

        {/* One valid diagram per type: an add button appears only for types
            that don't have one yet. Updating an existing diagram archives
            the previous version (restorable below). */}
        {canWrite && missingTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {missingTypes.map((dt) => (
              <Button
                key={dt}
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditorTarget({ id: null, type: dt, title: "" })
                }
              >
                <Icon name="Add" size={15} />
                {t(`types.${dt}`)}
              </Button>
            ))}
          </div>
        )}

        {activeDiagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-14 text-center">
            <IconBadge name="Category" tone="primary" size="xl" className="mb-4" />
            <p className="text-h4 text-foreground">{t("diagrams.empty")}</p>
            <p className="mt-1 max-w-sm text-p3 text-muted-foreground">
              {t("diagrams.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeDiagrams.map((d) => (
              <DiagramCard
                key={d.id}
                diagram={d}
                canWrite={canWrite}
                onOpen={() =>
                  setEditorTarget({ id: d.id, type: d.type, title: d.title })
                }
                onRename={() => setRenameTarget(d)}
                onDelete={() => setDeleteDiagramTarget(d)}
              />
            ))}
          </div>
        )}

        {/* Archive — superseded versions in the shared list recipe. Only the
            cards above are valid; restoring swaps a version back in. */}
        {archivedDiagrams.length > 0 && (
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-h4 text-foreground">
                {t("diagrams.archiveTitle")}
              </h3>
              <p className="mt-0.5 text-p3 text-muted-foreground">
                {t("diagrams.archiveSubtitle")}
              </p>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {archivedDiagrams.map((d) => (
                <div
                  key={d.id}
                  className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon name={DIAGRAM_TYPE_ICON[d.type]} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-l6 text-muted-foreground">
                      {d.title}
                    </span>
                    <span className="block text-p4 text-muted-foreground">
                      {t(`types.${d.type}`)} · V{d.version} ·{" "}
                      {t("diagrams.archivedOn", {
                        date: new Date(d.archived_at!).toLocaleDateString(),
                      })}
                    </span>
                  </span>
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await restoreDiagram(d.id, productId);
                            await refresh();
                          })
                        }
                        className="shrink-0 text-l6 text-primary hover:underline disabled:opacity-60"
                      >
                        {t("diagrams.restore")}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDiagramTarget(d)}
                        aria-label={t("card.delete")}
                      >
                        <Icon name="Trash" size={15} className="text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Evidence                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h3 text-foreground">{t("evidence.title")}</h2>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("evidence.subtitle")}
            </p>
          </div>
          {canWrite && (
            <Button size="sm" variant="outline" onClick={() => setEvidenceOpen(true)}>
              <Icon name="DocumentUpload" size={16} />
              {t("evidence.add")}
            </Button>
          )}
        </div>

        {evidence.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-14 text-center">
            <IconBadge name="DocumentText" tone="primary" size="xl" className="mb-4" />
            <p className="text-h4 text-foreground">{t("evidence.empty")}</p>
            <p className="mt-1 max-w-sm text-p3 text-muted-foreground">
              {t("evidence.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidence.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <IconBadge
                  name={EVIDENCE_CATEGORY_ICON[e.category]}
                  tone="muted"
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-l5 text-foreground">{e.title}</p>
                  <p className="truncate text-p4 text-muted-foreground">
                    {e.file_name} · {formatBytes(e.file_size)}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground sm:inline">
                  {t(`evidence.categories.${e.category}`)}
                </span>
                {e.annex_vii_point && (
                  <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-primary md:inline">
                    {t("evidence.annexShort", { point: e.annex_vii_point })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDownload(e)}
                  disabled={isPending}
                  aria-label={t("evidence.download")}
                >
                  <Icon name="Download" size={16} />
                </Button>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteEvidenceTarget(e)}
                    aria-label={t("evidence.delete")}
                  >
                    <Icon name="Trash" size={16} className="text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editor overlay */}
      {editorTarget && (
        <DiagramEditor
          productId={productId}
          target={editorTarget}
          onClose={() => setEditorTarget(null)}
          onSaved={() => {
            setEditorTarget(null);
            void refresh();
          }}
        />
      )}

      {/* Evidence upload dialog */}
      <EvidenceUploadDialog
        productId={productId}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        onUploaded={() => void refresh()}
      />

      {/* Rename dialog */}
      <RenameDialog
        target={renameTarget}
        productId={productId}
        onClose={() => setRenameTarget(null)}
        onRenamed={() => {
          setRenameTarget(null);
          void refresh();
        }}
      />

      {/* Delete confirmations */}
      <ConfirmDialog
        open={!!deleteDiagramTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteDiagramTarget(null);
        }}
        title={t("diagrams.deleteTitle")}
        description={t("diagrams.deleteDescription")}
        confirmLabel={isPending ? t("diagrams.deleting") : t("diagrams.deleteConfirm")}
        cancelLabel={t("diagrams.deleteCancel")}
        onConfirm={confirmDeleteDiagram}
        disabled={isPending}
      />
      <ConfirmDialog
        open={!!deleteEvidenceTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteEvidenceTarget(null);
        }}
        title={t("evidence.deleteTitle")}
        description={t("evidence.deleteDescription")}
        confirmLabel={isPending ? t("evidence.deleting") : t("evidence.deleteConfirm")}
        cancelLabel={t("evidence.deleteCancel")}
        onConfirm={confirmDeleteEvidence}
        disabled={isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diagram card
// ---------------------------------------------------------------------------

function DiagramCard({
  diagram,
  canWrite,
  onOpen,
  onRename,
  onDelete,
}: {
  diagram: DiagramRecord;
  canWrite: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("diagrams");

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full"
        aria-label={t("card.open")}
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-border bg-muted">
          {diagram.preview_signed_url ? (
            // object-cover so the drawing fills the whole preview area
            // instead of letterboxing inside it.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={diagram.preview_signed_url}
              alt={diagram.title}
              className="size-full object-cover"
            />
          ) : (
            <Icon
              name={DIAGRAM_TYPE_ICON[diagram.type]}
              size={32}
              className="text-muted-foreground/60"
            />
          )}
        </div>
      </button>
      <div className="flex items-start gap-2 p-4">
        <IconBadge
          name={DIAGRAM_TYPE_ICON[diagram.type]}
          tone="primary"
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-l5 text-foreground">{diagram.title}</p>
          <p className="text-p4 text-muted-foreground">
            {t(`types.${diagram.type}`)} · V{diagram.version}
          </p>
        </div>
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Icon name="More" size={16} />
              <span className="sr-only">{t("card.actions")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <Icon name="Edit" size={16} />
                {t("card.open")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>
                <Icon name="TextBlock" size={16} />
                {t("card.rename")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Icon name="Trash" size={16} />
                {t("card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rename dialog
// ---------------------------------------------------------------------------

function RenameDialog({
  target,
  productId,
  onClose,
  onRenamed,
}: {
  target: DiagramRecord | null;
  productId: string;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const t = useTranslations("diagrams");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync the input when a new target opens.
  const open = !!target;
  const currentTitle = target?.title ?? "";

  async function handleSave() {
    if (!target) return;
    const next = value.trim() || currentTitle;
    setSaving(true);
    await renameDiagram(target.id, productId, next);
    setSaving(false);
    onRenamed();
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setValue(currentTitle);
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
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-[18px] transition duration-200",
            "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          )}
        >
          <DialogPrimitive.Title className="text-h4 text-foreground">
            {t("card.renameTitle")}
          </DialogPrimitive.Title>
          <div className="mt-4">
            <Input
              autoFocus
              defaultValue={currentTitle}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("editor.titlePlaceholder")}
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close render={<Button variant="outline" size="sm" />}>
              {t("card.renameCancel")}
            </DialogPrimitive.Close>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t("card.renaming") : t("card.renameConfirm")}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
