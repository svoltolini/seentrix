/**
 * Copilot corpus ingestion.
 *
 * Reads three sources, chunks them, embeds them with mistral-embed, and
 * upserts into Supabase `kb_documents` + `kb_chunks`. Re-running the
 * script is idempotent thanks to the (doc_id, section_hash) unique
 * constraint — chunks whose text hasn't changed are skipped.
 *
 * Run it once after migration 00034 lands, and again whenever any
 * source doc is edited.
 *
 * Usage:
 *   MISTRAL_API_KEY=... \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx jiti ./scripts/copilot-ingest.ts
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { createMistral } from "@ai-sdk/mistral";

// ---------------------------------------------------------------------------
// Clients (initialised from env)
// ---------------------------------------------------------------------------

const mistralApiKey = requireEnv("MISTRAL_API_KEY");
const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const mistral = createMistral({ apiKey: mistralApiKey });
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Source registry — add new docs here.
// ---------------------------------------------------------------------------

interface SourceDoc {
  id: string;
  title: string;
  language: "en" | "de";
  sourceUrl?: string;
  /** Plain markdown content, with H2 ("## ") headings denoting chunk boundaries. */
  body: string;
}

const repoRoot = path.resolve(__dirname, "..");

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

const SOURCES: SourceDoc[] = [
  {
    id: "cra",
    title: "Cyber Resilience Act — curated reference",
    language: "en",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
    body: read("src/content/copilot/cra.md"),
  },
  {
    id: "seentrix-product",
    title: "Seentrix — product overview",
    language: "en",
    sourceUrl: "https://seentrix.com",
    body: read("src/content/copilot/seentrix-product.md"),
  },
];

// ---------------------------------------------------------------------------
// Chunking — split markdown into per-H2 sections, further split any
// section over ~800 tokens into roughly 500-token sub-chunks.
// ---------------------------------------------------------------------------

interface Chunk {
  docId: string;
  section: string | null;
  body: string;
  sectionHash: string;
  tokenCount: number;
}

const ESTIMATED_CHARS_PER_TOKEN = 4; // rough average for English prose

function chunksFromSource(doc: SourceDoc): Chunk[] {
  const lines = doc.body.split("\n");
  const sections: { heading: string | null; body: string[] }[] = [];
  let current: { heading: string | null; body: string[] } = {
    heading: null,
    body: [],
  };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current.body.length) sections.push(current);
      current = { heading: m[1], body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.length) sections.push(current);

  const out: Chunk[] = [];
  for (const s of sections) {
    const raw = s.body.join("\n").trim();
    if (!raw) continue;
    const subChunks = splitLongSection(raw, 500 * ESTIMATED_CHARS_PER_TOKEN);
    subChunks.forEach((body, i) => {
      const section =
        s.heading && subChunks.length > 1
          ? `${s.heading} (part ${i + 1})`
          : s.heading;
      const tokenCount = Math.round(body.length / ESTIMATED_CHARS_PER_TOKEN);
      out.push({
        docId: doc.id,
        section,
        body,
        sectionHash: sha1(body),
        tokenCount,
      });
    });
  }
  return out;
}

function splitLongSection(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const out: string[] = [];
  let buf: string[] = [];
  let bufLen = 0;
  for (const p of paragraphs) {
    if (bufLen + p.length + 2 > maxChars && buf.length) {
      out.push(buf.join("\n\n"));
      buf = [];
      bufLen = 0;
    }
    buf.push(p);
    bufLen += p.length + 2;
  }
  if (buf.length) out.push(buf.join("\n\n"));
  return out;
}

function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Copilot ingest — ${SOURCES.length} source document(s)`);

  // Step 1: upsert document registry rows.
  for (const s of SOURCES) {
    const { error } = await supabase.from("kb_documents").upsert({
      id: s.id,
      title: s.title,
      language: s.language,
      source_url: s.sourceUrl ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`kb_documents upsert failed: ${error.message}`);
  }

  // Step 2: chunk every source.
  const allChunks = SOURCES.flatMap(chunksFromSource);
  console.log(`  chunks produced: ${allChunks.length}`);

  // Step 3: figure out which chunks are new (not already present by hash).
  const hashes = allChunks.map((c) => c.sectionHash);
  const { data: existing, error: selErr } = await supabase
    .from("kb_chunks")
    .select("section_hash")
    .in("section_hash", hashes);
  if (selErr) throw new Error(`kb_chunks select failed: ${selErr.message}`);
  const existingHashes = new Set(
    (existing ?? []).map(
      (r: { section_hash: string }) => r.section_hash,
    ),
  );
  const newChunks = allChunks.filter((c) => !existingHashes.has(c.sectionHash));
  console.log(`  new chunks to embed: ${newChunks.length}`);

  // Step 4: embed the new ones in batches.
  if (newChunks.length) {
    // Mistral embed accepts batches of up to ~32 inputs; stay conservative.
    const batchSize = 16;
    const embeddings: number[][] = [];
    for (let i = 0; i < newChunks.length; i += batchSize) {
      const batch = newChunks.slice(i, i + batchSize);
      const { embeddings: embeddingsBatch } = await embedMany({
        model: mistral.embedding("mistral-embed"),
        values: batch.map((c) => c.body),
      });
      embeddings.push(...embeddingsBatch);
      process.stdout.write(
        `  embedded ${Math.min(i + batchSize, newChunks.length)}/${newChunks.length}\r`,
      );
    }
    console.log();

    // Step 5: insert rows with embeddings. We rely on the UNIQUE(doc_id,
    // section_hash) + on_conflict ignore path so re-runs are safe even
    // if a different run inserts the same hash concurrently.
    const rows = newChunks.map((c, i) => ({
      doc_id: c.docId,
      section: c.section,
      body: c.body,
      embedding: embeddings[i],
      token_count: c.tokenCount,
      section_hash: c.sectionHash,
    }));
    const { error: insErr } = await supabase
      .from("kb_chunks")
      .upsert(rows, { onConflict: "doc_id,section_hash", ignoreDuplicates: true });
    if (insErr) throw new Error(`kb_chunks insert failed: ${insErr.message}`);
  }

  // Step 6: prune chunks whose hash no longer appears in any source — keeps
  // the KB in lockstep with the repo.
  const liveHashes = new Set(hashes);
  const { data: allRows, error: allErr } = await supabase
    .from("kb_chunks")
    .select("id, doc_id, section_hash")
    .in(
      "doc_id",
      SOURCES.map((s) => s.id),
    );
  if (allErr) throw new Error(`kb_chunks fetch failed: ${allErr.message}`);
  const stale = (allRows ?? []).filter(
    (r: { section_hash: string }) => !liveHashes.has(r.section_hash),
  );
  if (stale.length) {
    console.log(`  pruning ${stale.length} stale chunk(s)`);
    const { error: delErr } = await supabase
      .from("kb_chunks")
      .delete()
      .in(
        "id",
        stale.map((r: { id: string }) => r.id),
      );
    if (delErr) throw new Error(`kb_chunks delete failed: ${delErr.message}`);
  }

  console.log("Copilot ingest — done");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
