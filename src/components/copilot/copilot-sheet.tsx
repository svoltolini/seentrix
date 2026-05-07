"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
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
 * an HTTP POST to /api/copilot/chat; page + locale metadata are attached
 * as extra body fields so the server can personalise retrieval.
 */
export function CopilotSheet() {
  const { isOpen, close, seed, clearSeed } = useCopilot();
  const t = useTranslations("copilot");
  const locale = useLocale() as "en" | "de";
  const pathname = usePathname();

  // Stable refs so the transport closure can read the latest locale + page
  // at send time without having to be recreated on every render (which would
  // reset the chat mid-stream).
  const sessionIdRef = useRef<string | null>(null);
  const localeRef = useRef(locale);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    localeRef.current = locale;
    pathnameRef.current = pathname;
  }, [locale, pathname]);

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
            locale: localeRef.current,
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
          // citation pills, link buttons, and multi-paragraph drafts
          // than a side-panel drawer. `2xl` = 672 px — ~75 % wider
          // than the default, still leaves the page visible behind it.
          "flex-col gap-0 border-l border-border bg-[#09090B] p-0",
          "data-[side=right]:sm:max-w-2xl",
        )}
      >
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>

        {/* Header ---------------------------------------------------------- */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-l6-plus uppercase tracking-[0.18em] text-[#066DE6]">
              <Icon name="ai-magic-stroke-rounded" size={12} />
              {t("eyebrow")}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium tracking-normal text-muted-foreground">
                beta
              </span>
            </span>
            <span className="font-heading text-base font-semibold text-foreground">
              {t("title")}
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
          onResume={(id, resumedMessages) => {
            sessionIdRef.current = id;
            setSessionId(id);
            setMessages(resumedMessages);
            stuckToBottomRef.current = true;
            setHistoryOpen(false);
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
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {t("error")}
            </div>
          )}
        </div>

        {/* Composer -------------------------------------------------------- */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-border bg-[#0B0B12] px-4 pt-3 pb-4"
        >
          {/*
            Flex row with `items-end` — when the textarea is one line
            (32 px tall) the button (32 px tall) aligns at the bottom of
            the container which, combined with the container's symmetric
            py-2, reads as vertically centred. When the textarea grows
            past one line the button stays in the bottom-right corner,
            matching the ChatGPT composer convention.
          */}
          <div className="flex items-end gap-2 rounded-md bg-muted px-3.5 py-2 ring-1 ring-white/[0.08] transition focus-within:bg-muted focus-within:ring-[#066DE6]/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t("placeholder")}
              rows={1}
              // Single-line height = 32 px so it matches the button.
              // leading-6 + py-1 gives 24 + 4 + 4 = 32.
              className="max-h-[180px] min-h-[32px] flex-1 resize-none bg-transparent py-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
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
                    ? "bg-[#066DE6] text-white hover:bg-[#066DE6]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon name="sent-stroke-rounded" size={15} />
              </button>
            )}
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
            {t("footer")}
          </p>
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
        <span className="text-l6-plus uppercase tracking-[0.18em] text-[#066DE6]">
          {t("emptyEyebrow")}
        </span>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("emptyTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
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
            className="flex w-full items-start gap-2 rounded-xl bg-muted px-3 py-3 text-left text-sm text-foreground/90 transition hover:bg-muted"
          >
            <Icon
              name="arrow-right-01-stroke-rounded"
              size={14}
              className="mt-1 shrink-0 text-[#066DE6]"
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
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#066DE6] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#066DE6]" />
      </span>
      <span>Thinking…</span>
    </div>
  );
}
