"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/ui/toast";
import {
  SideSheetBackdrop,
  SideSheetPopup,
  SideSheetHero,
  SideSheetBody,
} from "@/components/side-sheet";
import {
  CHECKLIST_STATUSES,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import {
  addChecklistAssignee,
  removeChecklistAssignee,
  loadChecklistThread,
  addChecklistComment,
  uploadChecklistAttachment,
  getChecklistAttachmentUrl,
  type ChecklistAssignee,
  type ChecklistItem,
  type ChecklistComment,
  type ChecklistAttachment,
} from "../checklist-actions";

const STATUS_DOT: Record<ChecklistStatus, string> = {
  pending: "bg-muted-foreground",
  in_progress: "bg-warning",
  completed: "bg-success",
  not_applicable: "bg-border",
};
const STATUS_SELECTED: Record<ChecklistStatus, string> = {
  pending: "border-border-strong bg-muted text-foreground",
  in_progress: "border-warning/40 bg-warning/10 text-warning",
  completed: "border-success/40 bg-success/10 text-success",
  not_applicable: "border-border-strong bg-muted text-muted-foreground",
};

function initials(name: string | null, email?: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  return src.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

type ThreadEntry =
  | { kind: "comment"; at: string; data: ChecklistComment }
  | { kind: "attachment"; at: string; data: ChecklistAttachment };

export function ChecklistItemSheet({
  open,
  onOpenChange,
  item,
  productId,
  members,
  editable,
  title,
  description,
  guidance,
  onStatusChange,
  onAssigneesChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ChecklistItem | null;
  productId: string;
  members: ChecklistAssignee[];
  editable: boolean;
  title: string;
  description: string;
  guidance: string;
  onStatusChange: (itemId: string, status: ChecklistStatus) => void;
  onAssigneesChange: (itemId: string, assignees: ChecklistAssignee[]) => void;
}) {
  const t = useTranslations("checklist");
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ChecklistStatus>("pending");
  const [assignees, setAssignees] = useState<ChecklistAssignee[]>([]);
  const [comments, setComments] = useState<ChecklistComment[]>([]);
  const [attachments, setAttachments] = useState<ChecklistAttachment[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [, startTransition] = useTransition();

  // Sync local state + load the thread whenever a new item opens.
  useEffect(() => {
    if (!open || !item) return;
    setStatus(item.status);
    setAssignees(item.assignees);
    setComments([]);
    setAttachments([]);
    setDraft("");
    setLoadingThread(true);
    let active = true;
    loadChecklistThread(item.id).then((res) => {
      if (!active) return;
      setComments(res.comments);
      setAttachments(res.attachments);
      setLoadingThread(false);
    });
    return () => {
      active = false;
    };
  }, [open, item]);

  if (!item) return null;
  const itemId = item.id;

  const statusDirty = status !== item.status;

  function saveStatus() {
    if (!statusDirty) return;
    onStatusChange(itemId, status);
    toast({ type: "success", message: t("saved") });
  }

  function toggleAssignee(m: ChecklistAssignee) {
    const on = assignees.some((a) => a.id === m.id);
    const next = on ? assignees.filter((a) => a.id !== m.id) : [...assignees, m];
    setAssignees(next);
    onAssigneesChange(itemId, next);
    startTransition(async () => {
      const res = on
        ? await removeChecklistAssignee(itemId, m.id)
        : await addChecklistAssignee(productId, itemId, m.id);
      if (res.error) {
        // Revert on failure.
        setAssignees(assignees);
        onAssigneesChange(itemId, assignees);
        toast({ type: "error", message: t("errors.generic") });
      }
    });
  }

  function postComment() {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    addChecklistComment(productId, itemId, body).then((res) => {
      setPosting(false);
      if (res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        setDraft("");
      } else {
        toast({ type: "error", message: t("errors.generic") });
      }
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const fd = new FormData();
      fd.set("file", file);
      setPosting(true);
      uploadChecklistAttachment(productId, itemId, fd).then((res) => {
        setPosting(false);
        if (res.attachment) {
          setAttachments((prev) => [...prev, res.attachment!]);
        } else {
          toast({
            type: "error",
            message:
              res.error === "fileTooLarge"
                ? t("thread.fileTooLarge")
                : t("errors.generic"),
          });
        }
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadAttachment(a: ChecklistAttachment) {
    startTransition(async () => {
      const res = await getChecklistAttachmentUrl(a.storage_path);
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  // Interleave comments + attachments into one chronological activity log.
  const thread: ThreadEntry[] = [
    ...comments.map((c) => ({ kind: "comment" as const, at: c.created_at, data: c })),
    ...attachments.map((a) => ({ kind: "attachment" as const, at: a.created_at, data: a })),
  ].sort((x, y) => +new Date(x.at) - +new Date(y.at));

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SideSheetBackdrop />
        <SideSheetPopup>
          <SideSheetHero eyebrow={item.regulation_article ?? ""} title={title} />
          <SideSheetBody>
            {/* What the requirement asks */}
            {description && (
              <p className="text-p3 leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            {guidance && (
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="mb-1 text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                  {t("guidanceLabel")}
                </p>
                <p className="text-p3 leading-relaxed text-muted-foreground">
                  {guidance}
                </p>
              </div>
            )}

            {/* Status — staged, saved with a button */}
            <div className="flex flex-col gap-2">
              <span className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                {t("statusLabel")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {CHECKLIST_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!editable}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-l6-plus transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      s === status
                        ? STATUS_SELECTED[s]
                        : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", STATUS_DOT[s])} />
                    {t(`statuses.${s}`)}
                  </button>
                ))}
                {editable && statusDirty && (
                  <Button size="sm" onClick={saveStatus} className="ml-auto">
                    {t("thread.saveStatus")}
                  </Button>
                )}
              </div>
            </div>

            {/* Assignees — one or more owners */}
            {editable && (
              <div className="flex flex-col gap-2">
                <span className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                  {t("assigneeLabel")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const on = assignees.some((a) => a.id === m.id);
                    const first = (m.full_name?.trim() || m.email || m.id).split(/[\s@]/)[0];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m)}
                        aria-pressed={on}
                        className={cn(
                          "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12.5px] font-semibold transition-colors",
                          on
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Avatar size="sm" className="size-6">
                          {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
                          <AvatarFallback>{initials(m.full_name, m.email)}</AvatarFallback>
                        </Avatar>
                        {first}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity — append-only audit thread */}
            <div className="flex flex-col gap-3">
              <span className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                {t("thread.title")}
              </span>
              {loadingThread ? (
                <p className="text-p4 text-muted-foreground">{t("thread.loading")}</p>
              ) : thread.length === 0 ? (
                <p className="text-p4 text-muted-foreground">{t("thread.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {thread.map((e) => (
                    <ThreadRow
                      key={`${e.kind}-${e.data.id}`}
                      entry={e}
                      attachmentLabel={t("thread.attached")}
                      onDownload={downloadAttachment}
                    />
                  ))}
                </ul>
              )}

              {/* Composer — comments save immediately (chat) */}
              {editable && (
                <div className="flex flex-col gap-2 rounded-lg border border-border-strong bg-card p-2.5">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") postComment();
                    }}
                    placeholder={t("thread.placeholder")}
                    className="w-full resize-none bg-transparent px-1.5 py-1 text-p3 text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      ref={fileRef}
                      type="file"
                      onChange={onFile}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={posting}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-l6 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                      <Icon name="Attachment" size={15} />
                      {t("thread.attach")}
                    </button>
                    <Button
                      size="sm"
                      onClick={postComment}
                      disabled={posting || !draft.trim()}
                    >
                      {t("thread.send")}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-p4 text-muted-foreground">{t("thread.immutableNote")}</p>
            </div>
          </SideSheetBody>
        </SideSheetPopup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

function ThreadRow({
  entry,
  attachmentLabel,
  onDownload,
}: {
  entry: ThreadEntry;
  attachmentLabel: string;
  onDownload: (a: ChecklistAttachment) => void;
}) {
  const author = entry.data.user;
  const when = new Date(entry.at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex gap-3">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
        <AvatarFallback>{initials(author?.name ?? null)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-l6 text-foreground">{author?.name ?? "—"}</span>
          <span className="text-p4 text-muted-foreground">{when}</span>
        </div>
        {entry.kind === "comment" ? (
          <p className="mt-0.5 whitespace-pre-wrap text-p3 text-foreground">
            {entry.data.body}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => onDownload(entry.data)}
            className="mt-1 inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-left transition-colors hover:bg-muted"
          >
            <Icon name="Attachment" size={14} className="shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-p4 text-foreground">
              {entry.data.file_name}
            </span>
            <span className="shrink-0 text-p4 text-muted-foreground">
              {attachmentLabel} · {fmtBytes(entry.data.size_bytes)}
            </span>
          </button>
        )}
      </div>
    </li>
  );
}
