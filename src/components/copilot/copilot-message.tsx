"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

/**
 * Render one message in the Copilot transcript.
 *
 * Three roles we care about in the UI:
 *  - user      → right-aligned subtle card, user's raw text
 *  - assistant → left-aligned prose, rich markdown + citation pills
 *                + inline "Go to X" buttons + draft cards, in exactly
 *                the order the model emitted them
 *  - system    → skipped (the server prompt is not shown to the user)
 *
 * Key design decision: we walk `message.parts` in order and render text
 * runs and tool-result parts interleaved, so a `linkToPage` button lands
 * right after the "Action:" line that introduced it instead of being
 * hoisted to the bottom of the message.
 */
export function CopilotMessage({ message }: { message: UIMessage }) {
  if (message.role === "system") return null;
  const isUser = message.role === "user";

  if (isUser) {
    const text = extractText(message);
    if (!text) return null;
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white/[0.06] px-3.5 py-2 text-sm leading-relaxed text-foreground">
          {text}
        </div>
      </div>
    );
  }

  if (!message.parts?.length) return null;
  const children = groupPartsInOrder(message.parts);
  if (children.length === 0) return null;

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[88%] flex-col gap-3 text-[14px] leading-[1.65] text-foreground/92">
        {children.map((c, i) => {
          if (c.kind === "text") return <AssistantBody key={i} text={c.text} />;
          if (c.kind === "link")
            return <LinkButton key={i} path={c.path} label={c.label} />;
          if (c.kind === "draft")
            return <DraftBlock key={i} title={c.title} draft={c.draft} />;
          return null;
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parts ordering — keep tool-result parts in their emitted position.
// ---------------------------------------------------------------------------

type Child =
  | { kind: "text"; text: string }
  | { kind: "link"; path: string; label: string }
  | { kind: "draft"; title: string; draft: string };

const DRAFT_TOOLS: Record<string, string> = {
  "tool-draftDeclarationOfConformity": "Declaration of Conformity",
  "tool-draftIncidentNarrative": "Incident narrative",
  "tool-draftVulnerabilityResponse": "Researcher acknowledgement",
};

function groupPartsInOrder(
  parts: NonNullable<UIMessage["parts"]>,
): Child[] {
  const out: Child[] = [];
  let textBuf = "";
  const flushText = () => {
    const trimmed = textBuf.trim();
    if (trimmed) out.push({ kind: "text", text: trimmed });
    textBuf = "";
  };
  for (const raw of parts as Array<{
    type: string;
    text?: string;
    state?: string;
    output?: { path?: string; label?: string; draft?: string };
  }>) {
    if (raw.type === "text" && typeof raw.text === "string") {
      textBuf += raw.text;
      continue;
    }
    if (raw.type === "tool-linkToPage" && raw.state === "output-available") {
      flushText();
      const path = raw.output?.path;
      const label = raw.output?.label;
      if (typeof path === "string" && typeof label === "string") {
        out.push({ kind: "link", path, label });
      }
      continue;
    }
    const draftTitle = DRAFT_TOOLS[raw.type];
    if (
      draftTitle &&
      raw.state === "output-available" &&
      typeof raw.output?.draft === "string"
    ) {
      flushText();
      out.push({ kind: "draft", title: draftTitle, draft: raw.output.draft });
      continue;
    }
    // Everything else (reasoning parts, in-progress tool calls, data parts)
    // is intentionally ignored — they'd either duplicate the final text or
    // produce mid-stream flicker with no real value to the user.
  }
  flushText();
  return out;
}

function extractText(m: UIMessage): string {
  if (!m.parts) return "";
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

function DraftBlock({ title, draft }: { title: string; draft: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard access (rare) — fall through silently.
    }
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.08]">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60A5FA]">
          <HugeIcon name="ai-magic-stroke-rounded" size={11} />
          Draft · {title}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition",
            copied
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground",
          )}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </header>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#0B0B12] px-3 py-2 text-xs leading-relaxed text-foreground/90 ring-1 ring-white/[0.04]">
        {draft}
      </pre>
    </div>
  );
}

function LinkButton({ path, label }: { path: string; label: string }) {
  return (
    <Link
      href={path}
      className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#3B82F6]/10 px-3.5 py-2 text-[13px] font-medium text-[#93C5FD] ring-1 ring-[#3B82F6]/25 transition hover:bg-[#3B82F6]/15 hover:text-white hover:ring-[#3B82F6]/50"
    >
      <HugeIcon
        name="arrow-right-01-stroke-rounded"
        size={13}
        className="text-[#60A5FA]"
      />
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Block-level renderer
// ---------------------------------------------------------------------------

type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string; numeral?: string }
  | { type: "h4"; text: string }
  | { type: "hr" }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string };

function AssistantBody({ text }: { text: string }) {
  const blocks = blockify(text);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-2 font-heading text-[17px] font-semibold leading-snug text-foreground"
              >
                {renderInline(b.text)}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="mt-3 flex items-baseline gap-2 font-heading text-[13px] font-semibold uppercase tracking-[0.16em] text-[#93C5FD]"
              >
                {b.numeral && (
                  <span className="rounded-md bg-[#3B82F6]/15 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-normal text-[#60A5FA]">
                    {b.numeral}
                  </span>
                )}
                <span>{renderInline(b.text)}</span>
              </h3>
            );
          case "h4":
            return (
              <h4
                key={i}
                className="mt-2 font-heading text-[13px] font-semibold text-foreground"
              >
                {renderInline(b.text)}
              </h4>
            );
          case "hr":
            return (
              <hr
                key={i}
                className="my-1 border-0 border-t border-white/[0.06]"
              />
            );
          case "ol":
            return (
              <ol
                key={i}
                className="ml-5 space-y-1.5 list-decimal marker:text-[#60A5FA] marker:font-semibold"
              >
                {b.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className="ml-1 space-y-1.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#60A5FA]" />
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-[#3B82F6]/40 bg-white/[0.02] pl-3 pr-2 py-1.5 italic text-muted-foreground"
              >
                {renderInline(b.text)}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-lg bg-[#0B0B12] px-3 py-2 text-[12px] leading-relaxed text-foreground/90 ring-1 ring-white/[0.06]"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "p":
          default:
            return (
              <p key={i} className="whitespace-pre-wrap">
                {renderInline(b.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

function blockify(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let buf: string[] = [];
  let list: { kind: "ol" | "ul"; items: string[] } | null = null;
  let codeFence: { lang: string; lines: string[] } | null = null;

  function flushParagraph() {
    const joined = buf.join("\n").trim();
    if (joined) blocks.push({ type: "p", text: joined });
    buf = [];
  }
  function flushList() {
    if (list) {
      blocks.push({ type: list.kind, items: list.items });
      list = null;
    }
  }
  function flushAll() {
    flushList();
    flushParagraph();
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Fenced code block — greedy capture.
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (codeFence) {
      if (fence) {
        blocks.push({ type: "code", text: codeFence.lines.join("\n") });
        codeFence = null;
      } else {
        codeFence.lines.push(raw);
      }
      continue;
    }
    if (fence) {
      flushAll();
      codeFence = { lang: fence[1] || "", lines: [] };
      continue;
    }

    // Headings first — break any open list/paragraph.
    const h4 = line.match(/^\s*####\s+(.+?)\s*#*\s*$/);
    const h3 = line.match(/^\s*###\s+(.+?)\s*#*\s*$/);
    const h2 = line.match(/^\s*##\s+(.+?)\s*#*\s*$/);
    if (h4) {
      flushAll();
      blocks.push({ type: "h4", text: h4[1] });
      continue;
    }
    if (h3) {
      flushAll();
      blocks.push({ type: "h3", text: h3[1] });
      continue;
    }
    if (h2) {
      flushAll();
      blocks.push({ type: "h2", text: h2[1] });
      continue;
    }

    // Horizontal rule.
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    // Blockquote.
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushAll();
      blocks.push({ type: "quote", text: quote[1] });
      continue;
    }

    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);

    // Auto-promote all-caps numbered section labels to H3 headings. The
    // model frequently writes "1. BASIC PRODUCT DETAILS" as a section
    // header; without this we render it as a list item and the following
    // sub-content drifts visually.
    if (ol) {
      const body = ol[2].trim();
      if (body.length >= 4 && /^[A-Z0-9][A-Z0-9 &()\-/]*$/.test(body)) {
        flushAll();
        blocks.push({ type: "h3", text: body, numeral: `${ol[1]}.` });
        continue;
      }
      flushParagraph();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ol[2]);
      continue;
    }
    if (ul) {
      flushParagraph();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    // Continuation of the current list item?
    if (list && line.trim() && /^\s{2,}/.test(raw)) {
      list.items[list.items.length - 1] += " " + line.trim();
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    // Non-list non-empty line — if a list was open, close it first so the
    // paragraph doesn't silently attach to the list.
    flushList();
    buf.push(line);
  }
  if (codeFence) {
    blocks.push({ type: "code", text: codeFence.lines.join("\n") });
  }
  flushAll();
  return blocks;
}

// ---------------------------------------------------------------------------
// Inline-span renderer — bold / italic / code / links / citation pills.
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let key = 0;
  // Priority: markdown link [text](url) > bold **x** > italic *x* >
  // citation [doc · section] > code `x`.
  // The link pattern is evaluated before the bare-bracket citation so we
  // don't strip it first.
  const pattern =
    /\[([^\[\]\n]+?)\]\(([^)\s]+)\)|\*\*([^*\n]+?)\*\*|(?<![*\w])\*([^*\n]+?)\*(?!\*)|\[([^[\]\n]+?)\]|`([^`\n]+?)`/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined && m[2] !== undefined) {
      // Markdown link [label](href).
      out.push(<InlineLink key={key++} label={m[1]} href={m[2]} />);
    } else if (m[3] !== undefined) {
      // Bold **text**.
      out.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m[3]}
        </strong>,
      );
    } else if (m[4] !== undefined) {
      // Italic *text*.
      out.push(
        <em key={key++} className="italic text-foreground/90">
          {m[4]}
        </em>,
      );
    } else if (m[5] !== undefined) {
      // Bare bracket — citation pill if it smells like one, else raw.
      if (
        m[5].includes("·") ||
        /^(Article|Annex|Artikel|Anhang|cra|seentrix)/i.test(m[5])
      ) {
        out.push(<CitationPill key={key++} label={m[5]} />);
      } else {
        out.push(m[0]);
      }
    } else if (m[6] !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[12px] font-mono text-foreground"
        >
          {m[6]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Citation pill — strong brand colour, uppercase typography, tight
 * corners. Replaces the subtle translucent version used in v1; the user
 * asked for punchier pills that match the rest of the app's chip design.
 */
function CitationPill({ label }: { label: string }) {
  // Normalise the separator to a middle dot and uppercase everything
  // so the pill renders consistently regardless of how the model wrote
  // the tag (e.g. "cra · Article 13(2)", "CRA - Art 13", etc.).
  const display = label
    .trim()
    .replace(/\s*[·•–—-]\s*/g, " · ")
    .toUpperCase();
  return (
    <span className="mx-0.5 inline-flex items-center rounded-md bg-[#3B82F6] px-1.5 py-[2px] align-[1px] text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_0_0_1px_rgba(59,130,246,0.35)]">
      {display}
    </span>
  );
}

/**
 * Render a markdown `[label](url)` pair as a real anchor. Internal
 * paths (`/app/…`, `/legal/…`, `/ai`, `/pricing`) route through the
 * locale-aware i18n Link so the user stays in-app; external URLs
 * open in a new tab with noreferrer.
 */
function InlineLink({ label, href }: { label: string; href: string }) {
  const className =
    "font-medium text-[#93C5FD] underline decoration-[#60A5FA]/40 decoration-1 underline-offset-2 transition hover:text-[#60A5FA] hover:decoration-[#60A5FA]";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}
