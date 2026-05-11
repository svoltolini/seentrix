"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { ChecklistItemCard } from "./components/checklist-item-card";
import { ChecklistKanban } from "./components/checklist-kanban";
import {
  calculateComplianceScore,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import {
  assignChecklistItem,
  updateChecklistItemStatus,
  updateChecklistItemDescription,
  uploadEvidence,
  removeEvidence,
  type ChecklistAssignee,
  type ChecklistItem,
  type Product,
} from "./checklist-actions";

type ViewMode = "list" | "kanban";

export function ComplianceChecklist({
  product,
  initialItems,
  members,
}: {
  product: Product;
  initialItems: ChecklistItem[];
  members: ChecklistAssignee[];
}) {
  const t = useTranslations("checklist");
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [view, setView] = useState<ViewMode>("kanban");

  const score = calculateComplianceScore(items);

  const partIItems = items.filter((i) => i.category === "part_i");
  const partIIItems = items.filter((i) => i.category === "part_ii");

  const partICompleted = partIItems.filter(
    (i) => i.status === "completed"
  ).length;
  const partITotal = partIItems.filter(
    (i) => i.status !== "not_applicable"
  ).length;
  const partIICompleted = partIIItems.filter(
    (i) => i.status === "completed"
  ).length;
  const partIITotal = partIIItems.filter(
    (i) => i.status !== "not_applicable"
  ).length;

  const handleStatusChange = useCallback(
    async (itemId: string, status: ChecklistStatus) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status } : i))
      );
      await updateChecklistItemStatus(itemId, status);
    },
    []
  );

  const handleNotesChange = useCallback(
    async (itemId: string, description: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, description } : i))
      );
      await updateChecklistItemDescription(itemId, description);
    },
    []
  );

  const handleEvidenceUpload = useCallback(
    async (itemId: string, file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadEvidence(product.id, itemId, formData);
      return result.path;
    },
    [product.id]
  );

  const handleEvidenceRemove = useCallback(
    async (_itemId: string, filePath: string) => {
      await removeEvidence(filePath);
    },
    []
  );

  const handleAssigneeChange = useCallback(
    async (itemId: string, userId: string | null) => {
      const assignee = userId
        ? members.find((m) => m.id === userId) ?? null
        : null;
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, assigned_to: userId, assignee } : i
        )
      );
      await assignChecklistItem(itemId, userId);
    },
    [members]
  );

  function findItem(requirementId: string) {
    return items.find((i) => i.title === requirementId);
  }

  const allPending = items.every(
    (i) => i.status === "pending" || i.status === "not_applicable"
  );

  return (
    <div className="space-y-6">
      {/* Encouragement banner */}
      {allPending && (
        <div className="flex items-start gap-4 rounded-md border border-primary/20 bg-primary/5 p-[18px]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon
              name="sparkles-stroke-rounded"
              size={20}
              className="text-primary"
            />
          </div>
          <div>
            <p className="text-h5 text-foreground">
              {t("getStarted")}
            </p>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("getStartedDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Score header — white card with a tier-tinted left-edge accent
          stripe + tinted icon block. Earlier passes used full-bleed
          gradient cards (green/orange/red) which violated the design
          memory rule "palette only, no per-card gradients". The tier
          signal lives in the 4 px left stripe and the icon block tone
          now; the rest of the card stays neutral so the score itself
          is the readable focus. */}
      <div className="relative overflow-hidden rounded-md bg-card shadow-card-md shadow-card-md">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            score >= 75
              ? "bg-success"
              : score >= 40
                ? "bg-accent"
                : "bg-destructive",
          )}
        />
        <div className="flex items-center gap-5 p-5">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-md",
              score >= 75
                ? "bg-success/10 text-success"
                : score >= 40
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            <Icon name="shield-check" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
              {t("title")}
            </p>
            <p className="text-h1 tabular-nums leading-none tracking-tight text-foreground">
              {score}%
            </p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="h-1.5 overflow-hidden rounded-xl bg-border">
            <div
              className={cn(
                "h-full rounded-xl transition-all duration-500",
                score >= 75
                  ? "bg-success"
                  : score >= 40
                    ? "bg-accent"
                    : "bg-destructive",
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* View-mode toggle — Kanban (Figma 41:1171) is the default; List is preserved
          as the legacy density-friendly view for users who prefer scanning. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["kanban", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-sm border-[1.5px] px-3 text-l6 transition-colors",
                view === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={view === mode}
            >
              <Icon name={mode === "kanban" ? "Kanban" : "RowVertical"} size={16} />
              {t.has(`view.${mode}`) ? t(`view.${mode}`) : mode}
            </button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <ChecklistKanban
          items={items}
          members={members}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>

      {/* Part I */}
      <div className="overflow-hidden rounded-md bg-card shadow-card-md">
        <div className="flex items-center gap-3 px-5 py-4">
          <Icon
            name="one-circle-stroke-rounded"
            size={22}
            className="shrink-0 text-foreground"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-h4 text-foreground">
              {t("partI")}
            </h3>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("partIDescription")}
            </p>
          </div>
          <span className="shrink-0 text-p4 tabular-nums text-muted-foreground">
            {t("itemCount", {
              completed: partICompleted,
              total: partITotal,
            })}
          </span>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {PART_I_REQUIREMENTS.map((req) => {
            const item = findItem(req.id);
            if (!item) return null;
            return (
              <ChecklistItemCard
                key={item.id}
                id={item.id}
                requirementId={req.id}
                part={req.part}
                article={req.article}
                status={item.status}
                description={item.description}
                assignee={item.assignee}
                members={members}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
                onEvidenceUpload={handleEvidenceUpload}
                onEvidenceRemove={handleEvidenceRemove}
                onAssigneeChange={handleAssigneeChange}
              />
            );
          })}
        </div>
      </div>

      {/* Part II */}
      <div className="overflow-hidden rounded-md bg-card shadow-card-md">
        <div className="flex items-center gap-3 px-5 py-4">
          <Icon
            name="two-circle-stroke-rounded"
            size={22}
            className="shrink-0 text-foreground"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-h4 text-foreground">
              {t("partII")}
            </h3>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("partIIDescription")}
            </p>
          </div>
          <span className="shrink-0 text-p4 tabular-nums text-muted-foreground">
            {t("itemCount", {
              completed: partIICompleted,
              total: partIITotal,
            })}
          </span>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {PART_II_REQUIREMENTS.map((req) => {
            const item = findItem(req.id);
            if (!item) return null;
            return (
              <ChecklistItemCard
                key={item.id}
                id={item.id}
                requirementId={req.id}
                part={req.part}
                article={req.article}
                status={item.status}
                description={item.description}
                assignee={item.assignee}
                members={members}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
                onEvidenceUpload={handleEvidenceUpload}
                onEvidenceRemove={handleEvidenceRemove}
                onAssigneeChange={handleAssigneeChange}
              />
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
