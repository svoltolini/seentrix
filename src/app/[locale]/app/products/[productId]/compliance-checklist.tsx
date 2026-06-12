"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Segmented } from "@/components/ui/segmented";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChecklistKanban } from "./components/checklist-kanban";
import { ChecklistItemSheet } from "./components/checklist-item-sheet";
import {
  calculateComplianceScore,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import {
  updateChecklistItemStatus,
  type ChecklistAssignee,
  type ChecklistItem,
  type Product,
} from "./checklist-actions";

type ViewMode = "list" | "kanban";

const STATUS_DOT: Record<ChecklistStatus, string> = {
  pending: "bg-muted-foreground",
  in_progress: "bg-warning",
  completed: "bg-success",
  not_applicable: "bg-border",
};

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  return src.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

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
  editable = true,
}: {
  product: Product;
  initialItems: ChecklistItem[];
  members: ChecklistAssignee[];
  /** Viewers are read-only — status / assignees / thread composer hidden. */
  editable?: boolean;
}) {
  const t = useTranslations("checklist");
  const tReq = useTranslations("checklist");
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [view, setView] = useState<ViewMode>("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

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

  // Assignee add/remove is persisted inside the sheet; here we just mirror
  // the new set into local state so the list rows update.
  const handleAssigneesChange = useCallback(
    (itemId: string, assignees: ChecklistAssignee[]) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, assignees } : i))
      );
    },
    []
  );

  function findItem(requirementId: string) {
    return items.find((i) => i.title === requirementId);
  }

  const activeItem = items.find((i) => i.id === activeId) ?? null;
  const activeNs =
    activeItem?.category === "part_ii"
      ? "vulnerabilityRequirements"
      : "requirements";
  const reqText = (key: string) =>
    activeItem && tReq.has(`${activeNs}.${activeItem.title}.${key}`)
      ? tReq(`${activeNs}.${activeItem.title}.${key}`)
      : "";

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
              <ChecklistRow
                key={item.id}
                item={item}
                title={
                  t.has(`requirements.${req.id}.title`)
                    ? t(`requirements.${req.id}.title`)
                    : req.article
                }
                statusLabel={t(`statuses.${item.status}`)}
                onOpen={() => setActiveId(item.id)}
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
              <ChecklistRow
                key={item.id}
                item={item}
                title={
                  t.has(`vulnerabilityRequirements.${req.id}.title`)
                    ? t(`vulnerabilityRequirements.${req.id}.title`)
                    : req.article
                }
                statusLabel={t(`statuses.${item.status}`)}
                onOpen={() => setActiveId(item.id)}
              />
            );
          })}
        </div>
      </div>
        </>
      )}

      <ChecklistItemSheet
        open={activeId !== null}
        onOpenChange={(o) => !o && setActiveId(null)}
        item={activeItem}
        productId={product.id}
        members={members}
        editable={editable}
        title={reqText("title")}
        description={reqText("description")}
        guidance={reqText("guidance")}
        onStatusChange={handleStatusChange}
        onAssigneesChange={handleAssigneesChange}
      />
    </div>
  );
}

/** A checklist list row — title, assignee avatars, status, opens the sheet. */
function ChecklistRow({
  item,
  title,
  statusLabel,
  onOpen,
}: {
  item: ChecklistItem;
  title: string;
  statusLabel: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/60",
        item.status === "not_applicable" && "opacity-60",
      )}
    >
      <span className="min-w-0 flex-1 text-l6 text-foreground">{title}</span>
      {item.assignees.length > 0 && (
        <span className="flex shrink-0 -space-x-2">
          {item.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.id} size="sm" className="ring-2 ring-card" title={a.full_name ?? a.email ?? ""}>
              {a.avatar_url && <AvatarImage src={a.avatar_url} alt="" />}
              <AvatarFallback>{initialsOf(a.full_name, a.email)}</AvatarFallback>
            </Avatar>
          ))}
          {item.assignees.length > 3 && (
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
              +{item.assignees.length - 3}
            </span>
          )}
        </span>
      )}
      <span className="flex shrink-0 items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", STATUS_DOT[item.status])} />
        <span className="text-p4 text-muted-foreground">{statusLabel}</span>
      </span>
      <Icon name="ChevronRightIcon" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
