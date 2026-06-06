"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";
import { CopilotMessage } from "./copilot-message";
import { CopilotFeedback } from "./copilot-feedback";
import { CopilotHistory } from "./copilot-history";
import { clearCopilotHistory } from "@/app/[locale]/app/settings/copilot-actions";
import { useToast } from "@/components/ui/toast";

/**
 * Seentrix Copilot — the actual drawer.
 *
 * Rendered once at app-layout level (via CopilotProvider) so state persists
 * across navigations. The sheet slides in from the right at ~384 px (the
 * same width as every other right-side panel in the app), dropping from
 * the bottom on mobile via the base-ui Sheet primitive's responsive
 * behaviour.
 *
 * Chat state is owned by `useChat` from @ai-sdk/react. The transport is
 * an HTTP POST to /api/copilot/chat; page metadata is attached as an extra
 * body field so the server can personalise retrieval.
 */
export function CopilotSheet() {
  const { isOpen, close, seed, clearSeed } = useCopilot();
  const t = useTranslations("copilot");
  const pathname = usePathname();

  // Stable ref so the transport closure can read the latest page at send
  // time without being recreated on every render (which would reset the
  // chat mid-stream).
  const sessionIdRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // We also render the session id in-component (for the feedback row), so
  // keep a state mirror that updates after each POST returns its
  // x-copilot-session header.
  const [sessionId, setSessionId] = useState<string | null>(null);

  /* eslint-disable react-hooks/refs */
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/copilot/chat",
        credentials: "include",
        // Hijack fetch so we can snapshot the x-copilot-session header
        // the server returns — we need it both to continue the same
        // session on the next turn and to key feedback on a real
        // chat_sessions.id.
        fetch: async (input, init) => {
          const res = await fetch(input, init);
          const returnedSessionId = res.headers.get("x-copilot-session");
          if (returnedSessionId) {
            sessionIdRef.current = returnedSessionId;
            setSessionId(returnedSessionId);
          }
          return res;
        },
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            sessionId: sessionIdRef.current ?? undefined,
            locale: "en",
            page: { path: pathnameRef.current },
          },
        }),
      }),
  );
  /* eslint-enable react-hooks/refs */

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport,
  });

  const { toast } = useToast();
  const [clearing, startClear] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);

  function onClearHistory() {
    if (!window.confirm(t("clearHistoryConfirm"))) return;
    startClear(async () => {
      const res = await clearCopilotHistory();
      if (res.ok) {
        setMessages([]);
        sessionIdRef.current = null;
        toast({ type: "success", message: t("clearHistoryDone") });
      } else {
        toast({ type: "error", message: t("clearHistoryFailed") });
      }
    });
  }

  useEffect(() => {
    if (isOpen && seed) {
      setInput(seed);
      clearSeed();
    }
  }, [isOpen, seed, clearSeed]);

  // Scroll-to-bottom on new message unless the user has scrolled up.
  const scrollRef = useRef<HTMLDivElement>(null);
  const stuckToBottomRef = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stuckToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    stuckToBottomRef.current = atBottom;
  }

  const isStreaming = status === "streaming" || status === "submitted";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage({ text });
  }

  function onComposerKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  }

  const empty = messages.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          // Override the base Sheet's `sm:max-w-sm` (384 px). Copilot
          // conversations need more horizontal space for code blocks,
          // citation pills, link buttons, tables, and multi-paragraph
          // drafts than a side-panel drawer. `3xl` = 768 px — wider than
          // the default while still leaving the page visible behind it;
          // ~10% wider than 3xl; matched to the shared SideSheetPopup width.
          "flex-col gap-0 border-l border-border bg-card p-0",
          "data-[side=right]:sm:max-w-[845px]",
        )}
      >
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>

        {/* Header — single "Seentrix AI" line on a soft primary wash so
            the panel reads as a sibling of the Help Centre intro
            sheet (same visual grammar, different content). The earlier
            two-line "SEENTRIX AI / Seentrix AI" stack was rendering
            the same string twice because both `copilot.eyebrow` and
            `copilot.title` resolved to "Seentrix AI". */}
        <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-2 text-h5 text-foreground">
            <Icon
              name="ai-magic-stroke-rounded"
              size={16}
              className="text-primary"
            />
            {t("title")}
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-l6-plus uppercase tracking-[1px] text-muted-foreground">
              beta
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label={t("history.open")}
              title={t("history.open")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon name="time-quarter-02-stroke-rounded" size={16} />
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                disabled={clearing}
                aria-label={t("clearHistory")}
                title={t("clearHistory")}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <Icon name="comment-remove-02-stroke-rounded" size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon
                name="cancel-circle-half-dot-stroke-rounded"
                size={18}
              />
            </button>
          </div>
        </div>

        {/* History overlay — covers the entire content area (including
            header) so there's no awkward scroll interaction with the
            transcript beneath. Has its own header + close button. */}
        <CopilotHistory
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          activeSessionId={sessionId}
          onResume={(id, resumedMessages) => {
            sessionIdRef.current = id;
            setSessionId(id);
            setMessages(resumedMessages);
            stuckToBottomRef.current = true;
            setHistoryOpen(false);
          }}
          onActiveDeleted={() => {
            // Mirror the cleanup `onClearHistory` does — drop the
            // session id + clear the transcript so the chat surface
            // resets to an empty state matching the now-empty history.
            sessionIdRef.current = null;
            setSessionId(null);
            setMessages([]);
          }}
        />

        {/* Transcript / empty state --------------------------------------- */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-5 py-5"
        >
          {empty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m, i) => (
                <div key={m.id} className="flex flex-col">
                  <CopilotMessage message={m} />
                  {m.role === "assistant" &&
                    // Only offer feedback once streaming of this turn is
                    // done — still-streaming messages would get rated
                    // mid-sentence.
                    (i < messages.length - 1 || status === "ready") && (
                      <CopilotFeedback
                        sessionId={sessionId}
                        message={m}
                        precedingUserText={findPrecedingUserText(messages, i)}
                      />
                    )}
                </div>
              ))}
              {status === "submitted" && <ThinkingBubble />}
            </div>
          )}
          {error && !hasStreamedContent(messages) && (
            <div className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-p3 text-destructive">
              {t("error")}
            </div>
          )}
        </div>

        {/* Composer -------------------------------------------------------- */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-border bg-card px-4 pt-3 pb-4"
        >
          {/*
            Flex row with `items-end` so the send button sits in the
            bottom-right corner of the composer (ChatGPT convention). The
            textarea now opens at two lines for a roomier prompt box and
            still auto-grows up to the max height.
          */}
          <div className="flex items-end gap-2 rounded-md bg-input px-3.5 py-2.5 border-[1.5px] border-transparent transition focus-within:bg-card focus-within:border-primary/30">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t("placeholder")}
              rows={2}
              // Two-line starting height = 56 px (leading-6 × 2 + py-1 × 2).
              // Grows with content up to the max, then scrolls.
              className="max-h-[180px] min-h-[56px] flex-1 resize-none bg-transparent py-1 text-p2 leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                aria-label={t("stop")}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon name="stop-circle-stroke-rounded" size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label={t("send")}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition",
                  input.trim()
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon name="sent-stroke-rounded" size={15} />
              </button>
            )}
          </div>
          {/* Disclosure footer ("Powered by Mistral · hosted in EU ·
              not legal advice") moved to the Help Centre intro sheet
              so the chat surface stays focused on the conversation. */}
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState() {
  const t = useTranslations("copilot");
  const { open } = useCopilot();
  const examples = [
    t("examples.art13"),
    t("examples.sbom"),
    t("examples.incident"),
  ];
  return (
    <div className="flex h-full flex-col items-start gap-6 py-2">
      <div className="flex flex-col gap-2">
        <span className="text-l6-plus uppercase tracking-[0.18em] text-primary">
          {t("emptyEyebrow")}
        </span>
        <h2 className="text-h3 text-foreground">
          {t("emptyTitle")}
        </h2>
        <p className="text-p3 leading-relaxed text-muted-foreground">
          {t("emptyBody")}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <span className="text-l6-plus uppercase tracking-[0.16em] text-muted-foreground">
          {t("tryAsking")}
        </span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => open(ex)}
            className="flex w-full items-start gap-2 rounded-md bg-muted px-3 py-3 text-left text-p3 text-foreground transition hover:bg-muted/60"
          >
            <Icon
              name="arrow-right-01-stroke-rounded"
              size={14}
              className="mt-1 shrink-0 text-primary"
            />
            <span>{ex}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Has the most recent assistant turn produced any visible content? We
 * use this to suppress the generic "Something went wrong" banner when
 * the user actually got a full answer — a stray post-stream error
 * (e.g. a trailing tool call that 4xx'd on quota, or a mid-stream
 * timeout after the final token) shouldn't scare them. If no
 * content came through, the banner still surfaces so they know to
 * retry.
 */
function hasStreamedContent(messages: import("ai").UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    if (!m.parts) return false;
    for (const p of m.parts as Array<{
      type: string;
      text?: string;
      state?: string;
    }>) {
      if (p.type === "text" && p.text && p.text.trim().length > 0) return true;
      if (p.type.startsWith("tool-") && p.state === "output-available")
        return true;
    }
    return false;
  }
  return false;
}

/**
 * Walk backwards from the assistant message at `index` to the most
 * recent user message. Used to snapshot the question alongside the
 * rating so the admin review page is self-contained.
 */
function findPrecedingUserText(
  messages: import("ai").UIMessage[],
  index: number,
): string {
  for (let i = index - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user" || !m.parts) continue;
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n")
      .trim();
  }
  return "";
}

function ThinkingBubble() {
  return (
    <div className="flex items-center gap-2 text-p4 text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span>Thinking…</span>
    </div>
  );
}
