import { embed } from "ai";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { mistral, MISTRAL_EMBED_MODEL } from "./mistral";

/**
 * RAG retrieval helpers.
 *
 * Two concerns:
 *
 *   1) Turning a user question into a 1024-dim vector via mistral-embed.
 *   2) Running a cosine-similarity search against `kb_chunks` via the
 *      `match_kb_chunks` RPC.
 *
 * We use the service-role Supabase client here — not the user's — because
 * the KB is global and we want retrieval to work without the user having
 * a session when embedding pre-rendered pages (e.g. marketing copy). The
 * RPC itself is `SECURITY DEFINER` and read-only, so no privilege escalation
 * risk.
 */

export interface RetrievedChunk {
  id: string;
  doc_id: string;
  section: string | null;
  body: string;
  similarity: number;
}

let _serviceClient: ReturnType<typeof createServiceClient> | null = null;
function serviceClient() {
  if (_serviceClient) return _serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set",
    );
  }
  _serviceClient = createServiceClient(url, key, {
    auth: { persistSession: false },
  });
  return _serviceClient;
}

/**
 * Embed a piece of text via mistral-embed. 1024-dim cosine space.
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: mistral.embedding(MISTRAL_EMBED_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * Run a top-k similarity search against the knowledge base.
 *
 * @param query     The user's question (last turn) + light conversation context.
 * @param language  Filter chunks to this language ('en'); NULL = no filter.
 * @param k         How many chunks to return. Default 8.
 */
export async function retrieveChunks({
  query,
  language = null,
  k = 8,
}: {
  query: string;
  language?: "en" | null;
  k?: number;
}): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];

  const embedding = await embedText(query);
  // The supabase-js typed client doesn't know about custom RPCs, so we
  // relax the generic to `any` for this single call. The shape of the
  // params + result is pinned by `RetrievedChunk` and the migration.
  const rpc = serviceClient().rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: RetrievedChunk[] | null; error: { message: string } | null }>;
  const { data, error } = await rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_count: k,
    filter_language: language,
  });
  if (error) {
    throw new Error(`match_kb_chunks failed: ${error.message}`);
  }
  return data ?? [];
}
