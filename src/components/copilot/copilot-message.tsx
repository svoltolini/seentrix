"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

/**
 * Render one message in the Copilot transcript.
 *
 * Three roles we care about in the UI:
 *  - user      → right-aligned subtle card, user's raw text
 *  - assistant → left-aligned prose, light markdown + citation pills
 *  - system    → skipped (the server prompt is not shown to the user)
 *
 * We run a tiny inline formatter (not full markdown — v1 scope) that
 * handles **bold**, newlines, ordered/unordered lists, and turns citation
 * tags like `[cra · Article 13(2)]` into styled pills. Swap this for
 * react-markdown in phase 2 if the content grows richer.
 */
export function CopilotMessage({ message }: { message: UIMessage }) {
  if (message.role === "system") return null;

  const text = extractText(message);
  if (!text) return null;

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-br-md bg-white/[0.05] px-3.5 py-2 text-foreground"
            : "text-foreground/95",
        )}
      >
        {isUser ? text : <AssistantBody text={text} />}
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

// ---------------------------------------------------------------------------
// Tiny formatter — good enough for phase 1.
// ---------------------------------------------------------------------------

function AssistantBody({ text }: { text: string }) {
  const blocks = blockify(text);
  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((b, i) => {
        if (b.type === "ol") {
          return (
            <ol key={i} className="ml-4 list-decimal space-y-1.5">
              {b.items.map((item, j) => (
                <li key={j} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="ml-4 list-disc space-y-1.5">
              {b.items.map((item, j) => (
                <li key={j} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: "p"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

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

  for (const raw of lines) {
    const line = raw.trimEnd();
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
    if (list) {
      // A continuation line within the current list item.
      if (line.trim()) {
        list.items[list.items.length - 1] += " " + line.trim();
        continue;
      }
      flushList();
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    buf.push(line);
  }
  flushList();
  flushParagraph();
  return blocks;
}

// Render inline spans: **bold**, `code`, and [doc · section] citation pills.
function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let i = 0;
  // Pattern: [...] citation OR **bold** OR `code` OR plain text chunk.
  const pattern = /\[([^[\]\n]+?)\]|\*\*([^*\n]+?)\*\*|`([^`\n]+?)`/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      // Citation — only render as a pill if it smells like a section
      // reference ("cra · Article 13(2)", "seentrix-product · SBOM").
      if (m[1].includes("·") || /^(Article|Annex|Artikel|Anhang)\s/.test(m[1])) {
        out.push(<CitationPill key={i++} label={m[1]} />);
      } else {
        out.push(m[0]);
      }
    } else if (m[2] !== undefined) {
      out.push(
        <strong key={i++} className="font-semibold text-foreground">
          {m[2]}
        </strong>,
      );
    } else if (m[3] !== undefined) {
      out.push(
        <code
          key={i++}
          className="rounded bg-white/[0.06] px-1 py-0.5 text-[12px] font-mono text-foreground"
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

function CitationPill({ label }: { label: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center rounded-full bg-[#60A5FA]/12 px-2 py-0.5 align-baseline text-[11px] font-medium text-[#93C5FD] ring-1 ring-[#60A5FA]/20">
      {label}
    </span>
  );
}
