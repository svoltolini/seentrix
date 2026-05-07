"use client";

import { useEffect, useState, useTransition } from "react";
import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * Past-conversations panel — slides over the transcript area of the
 * Seentrix AI drawer when the user clicks the history icon in the
 * header.
 *
 * Lists the user's last ~20 sessions. Clicking one calls
 * `onResume(sessionId, messages)` so the parent can swap the active
 * session id + push the transcript back into useChat's state. Clicking
 * the small trash icon deletes the session server-side and rerenders.
 *
 * Transcripts are loaded lazily on click — listing is a cheap request,
 * full messages only fetch when the user actually wants to resume.
 */

interface SessionRow {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function CopilotHistory({
  open,
  onClose,
  onResume,
}: {
  open: boolean;
  onClose: () => void;
  onResume: (
    sessionId: string,
    messages: UIMessage[],
    title: string | null,
  ) => void;
}) {
  const t = useTranslations("copilot");
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [deletingId, startDelete] = useTransition();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setError(null);
    setSessions(null);
    (async () => {
      try {
        const res = await fetch("/api/copilot/sessions", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { sessions: SessionRow[] };
        if (alive) setSessions(data.sessions);
      } catch (err) {
        if (alive) setError((err as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  async function onPick(sessionId: string) {
    setResumingId(sessionId);
    try {
      const res = await fetch(`/api/copilot/sessions/${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        session: SessionRow;
        messages: StoredMessage[];
      };
      const uiMessages: UIMessage[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
      }));
      onResume(data.session.id, uiMessages, data.session.title);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResumingId(null);
    }
  }

  function onDelete(sessionId: string) {
    startDelete(async () => {
      try {
        const res = await fetch(`/api/copilot/sessions/${sessionId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error(String(res.status));
        setSessions((s) => (s ?? []).filter((x) => x.id !== sessionId));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-l6-plus uppercase tracking-[0.18em] text-primary">
            <Icon name="ai-magic-stroke-rounded" size={12} />
            {t("history.eyebrow")}
          </span>
          <span className="text-h5 text-foreground">
            {t("history.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Icon name="cancel-circle-half-dot-stroke-rounded" size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {sessions === null && !error && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-p4 text-destructive">
            {t("history.loadError")}
          </div>
        )}
        {sessions?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-md bg-muted px-6 py-10 text-center text-p3 text-muted-foreground">
            <Icon
              name="bubble-chat-question-stroke-rounded"
              size={24}
              className="text-muted-foreground"
            />
            <span>{t("history.empty")}</span>
          </div>
        )}
        {sessions && sessions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md bg-muted p-3 border border-border-outline transition hover:bg-muted/60 hover:border-primary/25",
                  resumingId === s.id && "opacity-50",
                )}
              >
                <button
                  type="button"
                  onClick={() => onPick(s.id)}
                  disabled={resumingId !== null}
                  className="flex flex-1 flex-col items-start gap-0.5 text-left"
                >
                  <span className="line-clamp-1 text-l6 text-foreground">
                    {s.title || t("history.untitled")}
                  </span>
                  <span className="text-p4 text-muted-foreground">
                    {new Date(s.updated_at).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  disabled={deletingId}
                  aria-label={t("history.delete")}
                  title={t("history.delete")}
                  className="flex size-8 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition hover:bg-card hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                >
                  <Icon
                    name="comment-remove-02-stroke-rounded"
                    size={14}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
