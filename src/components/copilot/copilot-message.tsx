"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
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
    // Outgoing user bubble per Figma `58:28682` (`data-node-id="85:10323"`):
    //   bg-[rgba(167,174,193,0.25)] rounded-[10px] px-4 py-3
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-md bg-muted-foreground/25 px-4 py-3 text-p2 text-foreground">
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
      if (
        typeof path === "string" &&
        typeof label === "string" &&
        isRenderableLinkPath(path)
      ) {
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

/**
 * Guard against two known failure modes before we render a link button:
 *  - Unresolved `{placeholder}` segments (e.g. `/app/products/{productId}/sbom`)
 *    that would 404 if clicked. Happens when the model tries to link to
 *    a product-specific page but the user hasn't picked a product yet.
 *  - Empty or malformed paths.
 * The scheme also blocks any path that isn't under an in-app namespace —
 * this mirrors the tool's input-schema regex so hallucinated fake tags
 * can't sneak through arbitrary URLs.
 */
function isRenderableLinkPath(path: string): boolean {
  if (!path) return false;
  if (path.includes("{") || path.includes("}")) return false;
  return /^\/(app|pricing|ai|blog|legal)(\/|$)/.test(path);
}

/**
 * Match a hallucinated `<linkToPage path="..." label="..." />` tag the
 * model sometimes writes as prose instead of invoking the tool properly.
 * Attribute order is flexible — we accept path-first or label-first —
 * and the closing slash is optional (`< … >` or `< … />`). Returns
 * `null` when the line isn't a tag, so the caller can fall through
 * to normal paragraph handling.
 */
/**
 * Does this line read like a section heading even though the model
 * didn't prefix it with `##`? Catches the common English and German
 * patterns the model keeps emitting as bare prose:
 *
 *   "Who does Article 13 apply to?"
 *   "How to comply with Article 13 in Seentrix"
 *   "What about exceptions?"
 *   "Key deadlines"
 *   "Next steps"
 *   "Wer ist betroffen?"
 *
 * Keep this list conservative — false positives turn real prose into
 * big shouting headings. Everything here starts a sentence that a
 * human would naturally read as a section marker.
 */
function looksLikeSentenceHeading(line: string): boolean {
  if (/^[-*\d]/.test(line)) return false; // list markers
  if (line.includes(",") || line.includes(";")) return false; // prose
  const wordCount = line.split(/\s+/).length;
  if (wordCount > 12) return false;
  // Question-word patterns (EN + DE).
  if (
    /^(Who|What|How|When|Where|Why|Which|Wer|Was|Wie|Wann|Wo|Warum|Welche|Welcher|Welches)\b.*\?$/.test(
      line,
    )
  ) {
    return true;
  }
  // "How to …" / "Wie …" without a question mark.
  if (/^(How to|Wie man)\b/.test(line)) return true;
  // Short bare phrases that are almost always section markers.
  if (
    /^(Key\s|Next\s|Exceptions?$|Scope$|Important\s|Notes?$|Summary$|In summary|Bottom line$|Practical steps|Kernpunkte$|Nächste Schritte|Ausnahmen?$|Zusammenfassung$|Wichtig$|Hinweise?$|Fazit$)/i.test(
      line,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Re-case an all-caps line into sentence case so an auto-promoted
 * heading doesn't shout at the user. First letter capitalised; the
 * rest lowercase; small standalone tokens that are genuine acronyms
 * (≤ 4 chars, all consonants-or-digits, and in a known allow-list)
 * stay uppercase. Article / annex numbering is preserved.
 */
function toTitleCase(s: string): string {
  const ACRONYMS = new Set([
    "CRA",
    "EU",
    "UK",
    "US",
    "SBOM",
    "SPDX",
    "CVE",
    "CVSS",
    "GHSA",
    "IoT",
    "API",
    "TLS",
    "MFA",
    "GDPR",
    "DoC",
    "KEV",
    "ENISA",
    "CSIRT",
    "OS",
    "VDP",
    "CE",
    "OEM",
    "SaaS",
    "VPN",
  ]);
  return s
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const bare = token.replace(/[()?&:,.\-/]/g, "");
      if (ACRONYMS.has(bare.toUpperCase())) return token.toUpperCase();
      if (/^\d+(?:[.)]|$)/.test(token)) return token;
      return token.charAt(0) + token.slice(1).toLowerCase();
    })
    .join("");
}

/**
 * A line that contains only a markdown link `[label](url)` (optionally
 * preceded by a bullet or numbered marker) becomes a full-size action
 * button — same visual treatment as the old `linkToPage` tool result.
 * This is the primary way the model now emits "Go to X" affordances.
 * Returns `null` when the line is plain prose or the markdown link is
 * mixed with other text (in which case it stays inline).
 */
function parseBareMarkdownLink(
  line: string,
): { path: string; label: string } | null {
  const stripped = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
  const match = stripped.match(/^\[([^\[\]\n]+?)\]\(([^)\s]+)\)\s*$/);
  if (!match) return null;
  return { label: match[1], path: match[2] };
}

function parseHallucinatedLinkTag(
  line: string,
): { path: string; label: string } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("<linkToPage")) return null;
  const path = trimmed.match(/\bpath\s*=\s*["']([^"']+)["']/i)?.[1];
  const label = trimmed.match(/\blabel\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!path || !label) return null;
  return { path, label };
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
    <div className="flex flex-col gap-2 rounded-md bg-card p-3 border border-border">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-l6-plus uppercase tracking-[0.16em] text-primary">
          <Icon name="ai-magic-stroke-rounded" size={12} />
          Draft · {title}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "rounded-sm px-2 py-1 text-l6-plus transition",
            copied
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </header>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-sm bg-muted px-3 py-2 text-p4 leading-relaxed text-foreground border border-border">
        {draft}
      </pre>
    </div>
  );
}

function LinkButton({ path, label }: { path: string; label: string }) {
  return (
    <Link
      href={path}
      className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#066DE6]/10 px-3.5 py-2 text-[13px] font-medium text-[#93C5FD] ring-1 ring-[#066DE6]/25 transition hover:bg-[#066DE6]/15 hover:text-white hover:ring-[#066DE6]/50"
    >
      <Icon
        name="arrow-right-01-stroke-rounded"
        size={13}
        className="text-[#066DE6]"
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
  | { type: "code"; text: string }
  | { type: "link"; path: string; label: string };

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
                  <span className="rounded-md bg-[#066DE6]/15 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-normal text-[#066DE6]">
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
                className="my-1 border-0 border-t border-border"
              />
            );
          case "ol":
            return (
              <ol
                key={i}
                className="ml-5 space-y-1.5 list-decimal marker:text-[#066DE6] marker:font-semibold"
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
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#066DE6]" />
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-[#066DE6]/40 bg-muted pl-3 pr-2 py-1.5 italic text-muted-foreground"
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
          case "link":
            return <LinkButton key={i} path={b.path} label={b.label} />;
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

    // Bare all-caps lines like "KEY REQUIREMENTS OF ARTICLE 13",
    // "ANNEX I: FURTHER DETAILS", "WHO DOES ARTICLE 13 APPLY TO?" —
    // the model sometimes writes these instead of using `##`. Promote
    // them to H2 so the structure reads right. Gate on minimum length
    // (so two-letter tokens like "EU" aren't promoted) and that the
    // line contains at least one space (so "SBOM" alone isn't).
    const trimmed = line.trim();
    if (
      trimmed.length >= 8 &&
      trimmed.includes(" ") &&
      /^[A-Z0-9][A-Z0-9 :()?&\-/]{6,}$/.test(trimmed)
    ) {
      flushAll();
      blocks.push({ type: "h2", text: toTitleCase(trimmed) });
      continue;
    }

    // Sentence-case section-header lines that the model forgot to
    // mark with `##`. Common patterns:
    //   - "Who does X apply to?"
    //   - "What is X?"
    //   - "How to comply with X"
    //   - "When does X take effect"
    //   - "Why X matters"
    //   - "Key deadlines"  (no leading question word, but known stem)
    //   - German equivalents (Wer / Was / Wie / Wann / Wo / Warum)
    // Conservative: line must be short (<= 80 chars), on its own
    // (preceded by a blank line or no preceding content), not end
    // with a full stop (which would be a sentence), and start with
    // a known heading word.
    if (
      trimmed.length > 0 &&
      trimmed.length <= 80 &&
      !/[.]$/.test(trimmed) &&
      looksLikeSentenceHeading(trimmed) &&
      !list &&
      buf.length === 0
    ) {
      flushAll();
      blocks.push({ type: "h2", text: trimmed });
      continue;
    }

    // Horizontal rule.
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    // Hallucinated tool-call syntax — the model sometimes writes
    // `<linkToPage path="..." label="..." />` as literal text instead of
    // invoking the tool. Rescue it so the user still sees a working
    // button, and silently drop buttons with `{placeholder}` paths
    // that would 404 on click.
    const hallucinatedLink = parseHallucinatedLinkTag(line);
    if (hallucinatedLink) {
      flushAll();
      if (isRenderableLinkPath(hallucinatedLink.path)) {
        blocks.push({
          type: "link",
          path: hallucinatedLink.path,
          label: hallucinatedLink.label,
        });
      }
      continue;
    }

    // A line that is just a markdown link pointing at an in-app path
    // becomes a full-size action button. This is the primary way the
    // model emits "Go to X" affordances now that the `linkToPage`
    // tool is gone. Bullets / numbered markers in front of the link
    // are also accepted so the model can write lists of actions.
    const bareLink = parseBareMarkdownLink(line);
    if (bareLink && isRenderableLinkPath(bareLink.path)) {
      flushAll();
      blocks.push({
        type: "link",
        path: bareLink.path,
        label: bareLink.label,
      });
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
  // Priority (left to right):
  //   1. Markdown link      [label](/url)
  //   2. Parenthesised path (/app/products/new)   ← renders as pill
  //   3. Bold               **text**
  //   4. Italic             *text*
  //   5. Citation bracket   [CRA · Article 13]
  //   6. Inline code        `open`
  //
  // The markdown-link pattern is evaluated before the parenthesised-path
  // pattern so `[Open](/foo)` doesn't get split into link + loose parens.
  const pattern =
    /\[([^\[\]\n]+?)\]\(([^)\s]+)\)|\((\/(?:app|pricing|ai|blog|legal)(?:\/[a-zA-Z0-9_\-/]+)?)\)|\*\*([^*\n]+?)\*\*|(?<![*\w])\*([^*\n]+?)\*(?!\*)|\[([^[\]\n]+?)\]|`([^`\n]+?)`/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined && m[2] !== undefined) {
      // Markdown link [label](href).
      out.push(<InlineLink key={key++} label={m[1]} href={m[2]} />);
    } else if (m[3] !== undefined) {
      // Parenthesised in-app path — render as a compact white pill so
      // the user can click through. If the path carries an unresolved
      // `{placeholder}` we leave it as raw text instead of rendering a
      // broken button.
      if (isRenderableLinkPath(m[3])) {
        out.push(<PathPill key={key++} path={m[3]} />);
      } else {
        out.push(m[0]);
      }
    } else if (m[4] !== undefined) {
      // Bold **text**.
      out.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m[4]}
        </strong>,
      );
    } else if (m[5] !== undefined) {
      // Italic *text*.
      out.push(
        <em key={key++} className="italic text-foreground/90">
          {m[5]}
        </em>,
      );
    } else if (m[6] !== undefined) {
      // Bare bracket — citation pill if it smells like one, else raw.
      if (
        m[6].includes("·") ||
        /^(Article|Annex|Artikel|Anhang|cra|seentrix)/i.test(m[6])
      ) {
        out.push(<CitationPill key={key++} label={m[6]} />);
      } else {
        out.push(m[0]);
      }
    } else if (m[7] !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 text-[12px] font-mono text-foreground"
        >
          {m[7]}
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
    <span className="mx-0.5 inline-flex items-center rounded-md bg-[#066DE6] px-1.5 py-[2px] align-[1px] text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_0_0_1px_rgba(59,130,246,0.35)]">
      {display}
    </span>
  );
}

/**
 * Compact "Open" pill rendered in place of a parenthesised in-app path
 * like `(/app/products/new)`. Clicking routes through the locale-aware
 * i18n Link so the user always lands on the correct `/en/…` or `/de/…`
 * prefixed URL — a bare `/app/products/new` typed by hand would 404
 * because the middleware matcher only sees locale-prefixed routes.
 */
function PathPill({ path }: { path: string }) {
  return (
    <Link
      href={path}
      className="mx-1 inline-flex -translate-y-[1px] items-center gap-1 rounded-full bg-white px-2 py-[2px] align-baseline text-l6-plus text-[#09090B] shadow-[0_0_0_1px_rgba(255,255,255,0.4)] transition hover:bg-white/90"
    >
      <Icon
        name="arrow-right-01-stroke-rounded"
        size={10}
        className="text-[#09090B]"
      />
      Open
    </Link>
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
    "font-medium text-[#93C5FD] underline decoration-[#066DE6]/40 decoration-1 underline-offset-2 transition hover:text-[#066DE6] hover:decoration-[#066DE6]";

  // An internal path with an unresolved `{placeholder}` segment would
  // render as a clickable link that 404s on click — worse UX than plain
  // text. Show just the label as foreground prose so the user at least
  // understands what the model was pointing at.
  if (href.startsWith("/") && (href.includes("{") || href.includes("}"))) {
    return <span className="font-medium text-foreground">{label}</span>;
  }
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
