"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Segmented } from "@/components/ui/segmented";
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

/** Band-colored progress ring (≥75 green, ≥40 amber, else red). */
function ScoreRing({ score }: { score: number }) {
  const SIZE = 110;
  const STROKE = 10;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const color =
    score >= 75
      ? "var(--success)"
      : score >= 40
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeOpacity="0.25"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-h3 text-foreground">
        {score}%
      </span>
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      {/* Score — same ring recipe as the CRA readiness section: a band-
          colored progress ring with the serif % inside, heading + per-part
          progress beside it. */}
      <section className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-card p-[17px]">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <p className="text-h4 text-foreground">{t("title")}</p>
          <p className="mt-1 text-p3 text-muted-foreground">
            {t("partI")} ·{" "}
            {t("itemCount", { completed: partICompleted, total: partITotal })}
          </p>
          <p className="mt-0.5 text-p4 text-muted-foreground">
            {t("partII")} ·{" "}
            {t("itemCount", { completed: partIICompleted, total: partIITotal })}
          </p>
        </div>
      </section>

      {/* View switch — kanban is a read-only progress visualization; the
          list is where status, notes, evidence and assignees are edited. */}
      <Segmented
        value={view}
        onChange={(v) => setView(v as ViewMode)}
        options={(["kanban", "list"] as const).map((mode) => ({
          value: mode,
          label: t.has(`view.${mode}`) ? t(`view.${mode}`) : mode,
        }))}
      />

      {view === "kanban" ? (
        <ChecklistKanban items={items} />
      ) : (
        <>

      {/* Part I */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
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
      <div className="overflow-hidden rounded-lg border border-border bg-card">
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
