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
import { Button } from "@/components/ui/button";
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
 * across navigations. The sheet slides in from the right; on mobile it
 * drops from the bottom via the base-ui Sheet primitive's side="right"
 * responsive behaviour.
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
  // Stable refs that the transport closure reads lazily at request time.
  // Using refs (instead of the raw closure values) means we don't have to
  // recreate the DefaultChatTransport instance — and reset the chat — on
  // every navigation or locale toggle.
  const sessionIdRef = useRef<string | null>(null);
  const localeRef = useRef(locale);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    localeRef.current = locale;
    pathnameRef.current = pathname;
  }, [locale, pathname]);

  // Lazy-init the transport once; the prepareSendMessagesRequest callback
  // runs only when a message is actually being sent, so the ref reads are
  // safe. react-hooks/refs can't statically prove that (it treats any ref
  // passed into a function as "may be read during render"), so the whole
  // call is wrapped in an eslint-disable block.
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

  // If a caller opened the drawer with a seed question, inject it once.
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
    if (stuckToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
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
    // Enter sends; Shift+Enter inserts newline. ⌘/Ctrl+Enter also sends.
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
          "data-[side=right]:sm:max-w-[440px]",
        )}
      >
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>

        {/* Header ---------------------------------------------------------- */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#60A5FA]">
              <HugeIcon name="sparkles-stroke-rounded" size={12} />
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
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {t("clearHistory")}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("close")}
              onClick={close}
            >
              <CloseGlyph />
            </Button>
          </div>
        </div>

        {/* Transcript / empty state --------------------------------------- */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          {empty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-5">
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
          className="flex flex-col gap-2 border-t border-white/[0.06] bg-[#0B0B12] p-4"
        >
          <div className="flex items-end gap-2 rounded-2xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06] focus-within:ring-white/[0.14]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t("placeholder")}
              rows={1}
              className="max-h-[140px] min-h-[32px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={stop}
                aria-label={t("stop")}
              >
                <StopGlyph />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!input.trim()}
                aria-label={t("send")}
              >
                <SendGlyph />
              </Button>
            )}
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
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

// Inline SVG glyphs — simple geometric primitives kept inline so we don't
// pull in lucide-react or add extra assets to /public/icons for three
// universal UI affordances (close, send, stop).

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 19V6M6 11l6-6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
      />
    </svg>
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
