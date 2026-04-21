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
 *  - assistant → left-aligned prose, light markdown + citation pills
 *                + inline "Go to X" buttons from the linkToPage tool
 *  - system    → skipped (the server prompt is not shown to the user)
 *
 * Inline formatter handles **bold**, `code`, numbered / bulleted / H2 /
 * H3 / H4 / HR blocks, plus citation tags like `[cra · Article 13(2)]`
 * which render as strong uppercase blue pills. Tool parts are streamed
 * interleaved with text parts — we walk them in order so a tool button
 * lands exactly where the model emitted it.
 */
export function CopilotMessage({ message }: { message: UIMessage }) {
  if (message.role === "system") return null;

  const text = extractText(message);
  const linkParts = extractLinkParts(message);
  const draftParts = extractDraftParts(message);

  if (!text && linkParts.length === 0 && draftParts.length === 0) return null;

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-br-md bg-white/[0.06] px-3.5 py-2 text-foreground"
            : "flex flex-col gap-3 text-foreground/92",
        )}
      >
        {isUser ? (
          text
        ) : (
          <>
            {text && <AssistantBody text={text} />}
            {draftParts.map((d, i) => (
              <DraftBlock key={`d-${i}`} title={d.title} draft={d.draft} />
            ))}
            {linkParts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {linkParts.map((p, i) => (
                  <LinkButton key={`l-${i}`} path={p.path} label={p.label} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function extractText(m: UIMessage): string {
  if (!m.parts) return "";
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

/**
 * Pull out any `linkToPage` tool-result parts that have finished
 * resolving. Each one becomes a button we render after the prose.
 *
 * The AI SDK v6 tool-part type is `tool-<toolName>` and we only care
 * about the output-available state — upstream states (input-streaming,
 * input-available) are model-internal and shouldn't show anything.
 */
interface LinkPart {
  path: string;
  label: string;
}
function extractLinkParts(m: UIMessage): LinkPart[] {
  if (!m.parts) return [];
  const out: LinkPart[] = [];
  for (const p of m.parts as Array<{
    type: string;
    state?: string;
    output?: { path?: string; label?: string };
  }>) {
    if (p.type !== "tool-linkToPage") continue;
    if (p.state !== "output-available") continue;
    const path = p.output?.path;
    const label = p.output?.label;
    if (typeof path === "string" && typeof label === "string") {
      out.push({ path, label });
    }
  }
  return out;
}

/**
 * Pull out `draft*` tool-result parts (DoC / incident / vulnerability).
 * These are Pillar-4 "drafts the user copies" — they come back as long
 * markdown blocks that deserve their own collapsible card with a copy
 * button, not a line in the assistant's prose.
 */
interface DraftPart {
  title: string;
  draft: string;
}
const DRAFT_TOOLS: Record<string, string> = {
  "tool-draftDeclarationOfConformity": "Declaration of Conformity",
  "tool-draftIncidentNarrative": "Incident narrative",
  "tool-draftVulnerabilityResponse": "Researcher acknowledgement",
};
function extractDraftParts(m: UIMessage): DraftPart[] {
  if (!m.parts) return [];
  const out: DraftPart[] = [];
  for (const p of m.parts as Array<{
    type: string;
    state?: string;
    output?: { draft?: string };
  }>) {
    const title = DRAFT_TOOLS[p.type];
    if (!title) continue;
    if (p.state !== "output-available") continue;
    if (typeof p.output?.draft !== "string") continue;
    out.push({ title, draft: p.output.draft });
  }
  return out;
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-white/[0.08] transition hover:bg-white/[0.1] hover:ring-[#60A5FA]/30"
    >
      <HugeIcon
        name="arrow-right-01-stroke-rounded"
        size={12}
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
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "hr" }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

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
                className="mt-1 font-heading text-base font-semibold text-foreground"
              >
                {renderInline(b.text)}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="mt-2 flex items-center gap-2 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#93C5FD]"
              >
                <span className="h-1 w-1 rounded-full bg-[#60A5FA]" />
                {renderInline(b.text)}
              </h3>
            );
          case "h4":
            return (
              <h4
                key={i}
                className="mt-1 font-heading text-[13px] font-semibold text-foreground"
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
              <ol key={i} className="ml-4 space-y-1.5 list-decimal marker:text-[#60A5FA] marker:font-semibold">
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
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#60A5FA]" />
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
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

    // Headings — match first since they should break any open list/paragraph.
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

    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ol) {
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
    if (list && !line.trim()) {
      flushList();
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    buf.push(line);
  }
  flushAll();
  return blocks;
}

// ---------------------------------------------------------------------------
// Inline-span renderer — bold / code / citation pills.
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let key = 0;
  // Priority: citation [doc · section] > bold **x** > code `x`.
  const pattern = /\[([^[\]\n]+?)\]|\*\*([^*\n]+?)\*\*|`([^`\n]+?)`/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      // Only treat as citation if it smells like one — either has the
      // "doc · section" separator, or starts with a known regulatory
      // keyword. Otherwise let the raw `[...]` through (e.g. a markdown
      // link anchor that happens to slip in).
      if (
        m[1].includes("·") ||
        /^(Article|Annex|Artikel|Anhang|cra|seentrix)/i.test(m[1])
      ) {
        out.push(<CitationPill key={key++} label={m[1]} />);
      } else {
        out.push(m[0]);
      }
    } else if (m[2] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m[2]}
        </strong>,
      );
    } else if (m[3] !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[12px] font-mono text-foreground"
        >
          {m[3]}
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
