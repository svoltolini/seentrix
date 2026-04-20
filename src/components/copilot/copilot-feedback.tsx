"use client";

import { useState, useTransition } from "react";
import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

/**
 * Thumbs-up / thumbs-down row shown under each assistant message.
 *
 * Submitting a rating is fire-and-forget — the UI optimistically applies
 * the filled tint, then POSTs to /api/copilot/feedback. If the POST fails
 * the icon rolls back. A thumbs-down click also reveals an optional
 * "what went wrong?" comment box; submitting the comment re-upserts the
 * row with the comment attached.
 */
export function CopilotFeedback({
  sessionId,
  message,
  precedingUserText,
}: {
  sessionId: string | null;
  message: UIMessage;
  precedingUserText: string;
}) {
  const t = useTranslations("copilot");
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  // No rating can be recorded without a session id (we haven't POSTed
  // the first turn yet) — render nothing until the drawer has one.
  if (!sessionId) return null;

  const answer = message.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();

  async function submit(next: -1 | 1 | null, withComment?: string) {
    const prev = rating;
    // Optimistic update so the UI responds instantly.
    setRating(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/copilot/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            clientMessageId: message.id,
            rating: next,
            comment: withComment,
            question: precedingUserText,
            answer,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        // Rollback — the user sees the icon snap back rather than a toast.
        setRating(prev);
      }
    });
  }

  function onThumb(value: -1 | 1) {
    if (rating === value) {
      // Clicking the same rating again un-rates.
      submit(null);
      setCommentOpen(false);
      setComment("");
    } else {
      submit(value);
      if (value === -1) setCommentOpen(true);
      else setCommentOpen(false);
    }
  }

  function onSubmitComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    submit(-1, trimmed);
    setCommentOpen(false);
  }

  return (
    <div className="mt-2 flex flex-col gap-2 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1">
        <ThumbButton
          active={rating === 1}
          onClick={() => onThumb(1)}
          disabled={pending}
          icon="thumbs-up-stroke-rounded"
          activeClass="bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
          label={t("feedback.helpful")}
        />
        <ThumbButton
          active={rating === -1}
          onClick={() => onThumb(-1)}
          disabled={pending}
          icon="thumbs-down-stroke-rounded"
          activeClass="bg-rose-500/15 text-rose-400 ring-rose-500/30"
          label={t("feedback.notHelpful")}
        />
      </div>

      {commentOpen && (
        <form
          onSubmit={onSubmitComment}
          className="flex items-end gap-2 rounded-lg bg-white/[0.03] p-2 ring-1 ring-white/[0.06]"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("feedback.whatWentWrong")}
            rows={2}
            className="flex-1 resize-none bg-transparent text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
              comment.trim()
                ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                : "bg-white/[0.06] text-muted-foreground/40",
            )}
          >
            {t("feedback.submit")}
          </button>
        </form>
      )}
    </div>
  );
}

function ThumbButton({
  active,
  onClick,
  disabled,
  icon,
  activeClass,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: string;
  activeClass: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground/70 ring-1 ring-transparent transition",
        active
          ? activeClass
          : "hover:bg-white/[0.04] hover:text-foreground hover:ring-white/[0.08]",
      )}
    >
      <HugeIcon name={icon} size={13} />
    </button>
  );
}
