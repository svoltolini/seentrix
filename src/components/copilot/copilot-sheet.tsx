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
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";
import { CopilotMessage } from "./copilot-message";
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

  /* eslint-disable react-hooks/refs */
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/copilot/chat",
        credentials: "include",
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
          "!max-w-none w-full flex-col gap-0 border-l border-white/[0.06] bg-[#09090B] p-0",
          // Match the default right-side sheet width (~384 px) so the drawer
          // lines up with other panels in the app (HelpSheet, etc.) and leaves
          // more page context visible behind it.
          "data-[side=right]:sm:max-w-sm",
        )}
      >
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>

        {/* Header ---------------------------------------------------------- */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#60A5FA]">
              <HugeIcon name="ai-magic-stroke-rounded" size={12} />
              {t("eyebrow")}
              <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium tracking-normal text-muted-foreground">
                beta
              </span>
            </span>
            <span className="font-heading text-base font-semibold text-foreground">
              {t("title")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                disabled={clearing}
                aria-label={t("clearHistory")}
                title={t("clearHistory")}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground disabled:opacity-50"
              >
                <HugeIcon name="comment-remove-02-stroke-rounded" size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
            >
              <HugeIcon
                name="cancel-circle-half-dot-stroke-rounded"
                size={18}
              />
            </button>
          </div>
        </div>

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
              {messages.map((m) => (
                <CopilotMessage key={m.id} message={m} />
              ))}
              {status === "submitted" && <ThinkingBubble />}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {t("error")}
            </div>
          )}
        </div>

        {/* Composer -------------------------------------------------------- */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-white/[0.06] bg-[#0B0B12] px-4 pt-3 pb-4"
        >
          <div className="relative rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] transition focus-within:bg-white/[0.06] focus-within:ring-[#60A5FA]/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t("placeholder")}
              rows={1}
              className="block max-h-[160px] min-h-[72px] w-full resize-none bg-transparent px-4 pt-3.5 pr-14 pb-10 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
              disabled={isStreaming}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-2">
              <span className="text-[10px] font-medium text-muted-foreground/50">
                {isStreaming ? t("streaming") : t("hintEnter")}
              </span>
              <div className="pointer-events-auto">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    aria-label={t("stop")}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
                  >
                    <HugeIcon
                      name="stop-circle-stroke-rounded"
                      size={18}
                    />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label={t("send")}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      input.trim()
                        ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                        : "bg-white/[0.06] text-muted-foreground/40",
                    )}
                  >
                    <HugeIcon name="sent-stroke-rounded" size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/70">
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
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#60A5FA]">
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
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          {t("tryAsking")}
        </span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => open(ex)}
            className="flex w-full items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-3 text-left text-sm text-foreground/90 transition hover:bg-white/[0.06]"
          >
            <HugeIcon
              name="arrow-right-01-stroke-rounded"
              size={14}
              className="mt-1 shrink-0 text-[#60A5FA]"
            />
            <span>{ex}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#60A5FA] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#60A5FA]" />
      </span>
      <span>Thinking…</span>
    </div>
  );
}
