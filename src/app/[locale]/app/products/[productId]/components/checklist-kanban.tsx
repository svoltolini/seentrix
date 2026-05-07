"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import {
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import type {
  ChecklistAssignee,
  ChecklistItem,
} from "../checklist-actions";
import { ChecklistKanbanCard } from "./checklist-kanban-card";

/**
 * ChecklistKanban — 4-column kanban board verbatim from Figma `41:1171`.
 *
 * Layout (observed in `data-node-id="49:1673"`):
 *   container:  flex gap-[32px] items-start
 *   each column: flex flex-col gap-[24px], width 300px
 *   header:     `text-p3 text-muted-foreground` "Status (count)"
 *   tasks:      flex flex-col gap-[20px]
 *
 * Seentrix maps:
 *   Backlog        → status === "pending"
 *   On Progress    → status === "in_progress"
 *   Completed      → status === "completed"
 *   Not Applicable → status === "not_applicable"
 *
 * The Figma also shows an "Under Review" column; Seentrix doesn't have a
 * matching status, so we use "Not Applicable" in that slot since it carries
 * a similar "set aside, no further action" semantic.
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
  members: ChecklistAssignee[];
  onStatusChange: (id: string, status: ChecklistStatus) => void;
  onItemClick?: (id: string) => void;
}

export function ChecklistKanban({
  items,
  members,
  onStatusChange,
  onItemClick,
}: Props) {
  const t = useTranslations("checklist");

  function reqLabel(reqId: string) {
    const req = ALL_REQS.find((r) => r.id === reqId);
    if (!req) return reqId;
    const ns = req.part === "part_i" ? "requirements" : "vulnerabilityRequirements";
    return t.has(`${ns}.${req.id}.title`)
      ? t(`${ns}.${req.id}.title`)
      : req.article;
  }

  return (
    <div className="flex gap-8 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.key);
        return (
          <div
            key={col.key}
            className="flex w-[300px] shrink-0 flex-col gap-6"
          >
            {/* Column header */}
            <div className="flex items-center justify-between">
              <p className="text-p3 text-muted-foreground">
                {t(col.titleKey)} ({colItems.length})
              </p>
              <button
                type="button"
                aria-label="Column actions"
                className="inline-flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Icon name="More" size={20} />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-5">
              {colItems.map((item) => (
                <ChecklistKanbanCard
                  key={item.id}
                  id={item.id}
                  title={reqLabel(item.title)}
                  status={item.status}
                  assignee={item.assignee}
                  members={members}
                  onStatusChange={onStatusChange}
                  onClick={() => onItemClick?.(item.id)}
                />
              ))}
              {colItems.length === 0 && (
                <p className="rounded-md border border-dashed border-border-outline px-4 py-6 text-center text-p4 text-muted-foreground">
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
