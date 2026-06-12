"use client";

import { useTranslations } from "next-intl";
import {
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import type { ChecklistItem } from "../checklist-actions";
import { ChecklistKanbanCard } from "./checklist-kanban-card";

/**
 * ChecklistKanban — a read-only progress visualization of the checklist
 * (status, notes, evidence and assignees are edited in the List view).
 *
 * Four status columns share the row width; each column's cards sit in a
 * warm recessed trough so the groups read at a glance. Cards show the full
 * requirement title (no truncation), the article reference, and the real
 * assignee.
 *
 * Seentrix maps:
 *   Backlog        → status === "pending"
 *   On Progress    → status === "in_progress"
 *   Completed      → status === "completed"
 *   Not Applicable → status === "not_applicable"
 */

const COLUMNS: { key: ChecklistStatus; titleKey: string }[] = [
  { key: "pending",        titleKey: "kanban.backlog" },
  { key: "in_progress",    titleKey: "kanban.onProgress" },
  { key: "completed",      titleKey: "kanban.completed" },
  { key: "not_applicable", titleKey: "kanban.notApplicable" },
];

const ALL_REQS = [...PART_I_REQUIREMENTS, ...PART_II_REQUIREMENTS];

interface Props {
  items: ChecklistItem[];
}

export function ChecklistKanban({ items }: Props) {
  const t = useTranslations("checklist");

  function reqOf(reqId: string) {
    return ALL_REQS.find((r) => r.id === reqId) ?? null;
  }

  function reqLabel(reqId: string) {
    const req = reqOf(reqId);
    if (!req) return reqId;
    const ns = req.part === "part_i" ? "requirements" : "vulnerabilityRequirements";
    return t.has(`${ns}.${req.id}.title`)
      ? t(`${ns}.${req.id}.title`)
      : req.article;
  }

  return (
    <div className="flex gap-3.5 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.key);
        return (
          <div
            key={col.key}
            className="flex min-w-[240px] flex-1 shrink-0 flex-col gap-2.5"
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <p className="text-l6 text-foreground">{t(col.titleKey)}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                {colItems.length}
              </span>
            </div>

            {/* Cards in a recessed trough */}
            <div className="flex min-h-[140px] flex-col gap-2.5 rounded-lg bg-muted/60 p-2.5">
              {colItems.map((item) => (
                <ChecklistKanbanCard
                  key={item.id}
                  title={reqLabel(item.title)}
                  article={reqOf(item.title)?.article ?? null}
                  status={item.status}
                  assignee={item.assignee}
                />
              ))}
              {colItems.length === 0 && (
                <p className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border-strong px-4 py-6 text-center text-p4 text-muted-foreground">
                  {t("kanban.empty")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
