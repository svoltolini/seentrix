"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDownIcon,
  UploadIcon,
  FileIcon,
  XIcon,
} from "lucide-react";
import {
  CHECKLIST_STATUSES,
  type ChecklistStatus,
  parseItemDescription,
  serializeItemDescription,
} from "@/lib/constants/cra-requirements";

const STATUS_DOT: Record<ChecklistStatus, string> = {
  pending: "bg-muted-foreground/30",
  in_progress: "bg-[#D97706]",
  completed: "bg-[#16A34A]",
  not_applicable: "bg-muted-foreground/20",
};

const STATUS_SELECTED: Record<ChecklistStatus, string> = {
  pending: "border-foreground/30 bg-white/[0.04] text-foreground",
  in_progress: "border-[#D97706]/40 bg-[#D97706]/10 text-[#D97706]",
  completed: "border-[#16A34A]/40 bg-[#16A34A]/10 text-[#16A34A]",
  not_applicable:
    "border-muted-foreground/20 bg-white/[0.02] text-muted-foreground",
};

interface ChecklistItemCardProps {
  id: string;
  requirementId: string;
  part: "part_i" | "part_ii";
  article: string;
  status: ChecklistStatus;
  description: string | null;
  onStatusChange: (id: string, status: ChecklistStatus) => void;
  onNotesChange: (id: string, description: string) => void;
  onEvidenceUpload: (id: string, file: File) => Promise<string | null>;
  onEvidenceRemove: (id: string, fileName: string) => void;
}

export function ChecklistItemCard({
  id,
  requirementId,
  part,
  article,
  status,
  description,
  onStatusChange,
  onNotesChange,
  onEvidenceUpload,
  onEvidenceRemove,
}: ChecklistItemCardProps) {
  const t = useTranslations("checklist");
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = parseItemDescription(description);

  const translationNs =
    part === "part_i" ? "requirements" : "vulnerabilityRequirements";

  function handleNotesBlur(value: string) {
    const serialized = serializeItemDescription({
      notes: value,
      evidence: parsed.evidence,
    });
    onNotesChange(id, serialized);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = await onEvidenceUpload(id, file);
    setUploading(false);
    if (path) {
      const updated = serializeItemDescription({
        notes: parsed.notes,
        evidence: [...parsed.evidence, path],
      });
      onNotesChange(id, updated);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveEvidence(fileName: string) {
    const updated = serializeItemDescription({
      notes: parsed.notes,
      evidence: parsed.evidence.filter((f) => f !== fileName),
    });
    onNotesChange(id, updated);
    onEvidenceRemove(id, fileName);
  }

  return (
    <div
      className={cn(
        "transition-colors",
        status === "not_applicable" && "opacity-50"
      )}
    >
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">
            {t(`${translationNs}.${requirementId}.title`)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
            />
            <span className="text-xs text-muted-foreground">
              {t(`statuses.${status}`)}
            </span>
          </div>
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground/50 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="flex flex-col gap-5 border-t border-white/[0.04] bg-white/[0.015] px-5 py-5">
          {/* Article reference */}
          <span className="w-fit rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {article}
          </span>

          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${translationNs}.${requirementId}.description`)}
          </p>

          {/* Guidance */}
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground/50">
              {t("guidanceLabel")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`${translationNs}.${requirementId}.guidance`)}
            </p>
          </div>

          {/* Status selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground/50">
              {t("statusLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {CHECKLIST_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(id, s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    s === status
                      ? STATUS_SELECTED[s]
                      : "border-white/[0.06] bg-transparent text-muted-foreground hover:bg-white/[0.02] hover:text-foreground"
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", STATUS_DOT[s])}
                  />
                  {t(`statuses.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground/50">
              {t("notesLabel")}
            </span>
            <Textarea
              rows={3}
              placeholder={t("notesPlaceholder")}
              defaultValue={parsed.notes}
              onBlur={(e) => handleNotesBlur(e.target.value)}
            />
          </div>

          {/* Evidence */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground/50">
              {t("evidenceLabel")}
            </span>
            {parsed.evidence.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {parsed.evidence.map((filePath) => {
                  const fileName = filePath.split("/").pop() ?? filePath;
                  return (
                    <div
                      key={filePath}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-sm"
                    >
                      <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(filePath)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.md"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadIcon data-icon="inline-start" className="size-3.5" />
              {uploading ? t("saving") : t("uploadEvidence")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
