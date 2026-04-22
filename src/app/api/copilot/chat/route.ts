import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mistral, MISTRAL_CHAT_MODEL } from "@/lib/copilot/mistral";
import { retrieveChunks } from "@/lib/copilot/retrieval";
import { buildSystemPrompt } from "@/lib/copilot/prompt";
import { enrichPageContext } from "@/lib/copilot/context-enrichment";
import { buildCopilotTools } from "@/lib/copilot/tools";
import { checkQuota } from "@/lib/copilot/quota";

/**
 * POST /api/copilot/chat
 *
 * Streaming Copilot turn. Wire-format follows the Vercel AI SDK v6 contract
 * so the browser `useChat` hook can consume it as an SSE stream.
 *
 * Flow:
 *   1) Auth — must be a logged-in user in an org.
 *   2) Rate limit — burst (10/min/user) + monthly plan quota.
 *   3) Retrieve — embed the latest user message, pull top-k chunks.
 *   4) Build system prompt with retrieved passages + user context.
 *   5) Stream the response back with `streamText` + Mistral Large.
 *   6) onFinish — persist session + transcript for history.
 *
 * Runtime is Node (not edge) because @upstash/ratelimit + Supabase client
 * both use Node-specific APIs internally, and Mistral streaming works fine
 * on a Vercel fra1 Node function.
 */

export const runtime = "nodejs";
// Streaming a long multi-step answer (prose + several tool calls +
// follow-up prose) can legitimately take >60 s, especially when the
// question is broad like "what does Article 13 require?" and the
// answer is ~2,000 tokens. 120 s gives headroom without letting the
// function hang indefinitely.
export const maxDuration = 120;

interface ChatPayload {
  messages: UIMessage[];
  sessionId?: string;
  locale?: "en" | "de";
  page?: { title?: string; path?: string };
  product?: { name?: string; type?: string };
}

export async function POST(req: Request) {
  // --- 1. Auth --------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // --- 2. Parse payload -----------------------------------------------------
  let payload: ChatPayload;
  try {
    payload = (await req.json()) as ChatPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const messages = payload.messages ?? [];
  if (!messages.length) {
    return NextResponse.json({ error: "empty_messages" }, { status: 400 });
  }
  const locale: "en" | "de" = payload.locale === "de" ? "de" : "en";

  // --- 3. Resolve org + plan for quota + context ----------------------------
  const { data: org } = await supabase
    .from("organizations")
    .select("name, country, plan")
    .eq("id", orgId)
    .single();
  const plan = (org?.plan as string | undefined) ?? "free";

  // --- 4. Rate limit --------------------------------------------------------
  const quota = await checkQuota({ userId: user.id, plan });
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: quota.reason,
        resetAt: quota.resetAt,
        limit: quota.limit,
      },
      { status: 429 },
    );
  }

  // --- 5. Extract latest user turn for retrieval ----------------------------
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const latestQuery = lastUser ? extractText(lastUser) : "";

  // --- 6. Retrieve KB chunks ------------------------------------------------
  let passages: Awaited<ReturnType<typeof retrieveChunks>> = [];
  try {
    passages = latestQuery
      ? await retrieveChunks({ query: latestQuery, language: locale, k: 8 })
      : [];
  } catch (err) {
    // Non-fatal: we'll fall through to a "no passages" answer. Log every
    // field we can pull off an AI_APICallError so the surfaced message in
    // Vercel logs is self-diagnosing (status, URL, API response body).
    const e = err as {
      message?: string;
      statusCode?: number;
      url?: string;
      responseBody?: unknown;
      cause?: unknown;
    };
    console.error("[copilot] retrieval failed", {
      message: e?.message,
      statusCode: e?.statusCode,
      url: e?.url,
      responseBody: e?.responseBody,
      cause: e?.cause,
    });
  }

  // --- 7. Build system prompt ----------------------------------------------
  // Server enriches page + product context from the current path so the
  // client only has to send the URL it's on. Any failure is swallowed and
  // the base context (locale + org + plan) is still used.
  let context;
  try {
    context = await enrichPageContext({
      supabase,
      orgId,
      plan,
      locale,
      pagePath: payload.page?.path,
      orgName: (org?.name as string | undefined) ?? undefined,
      orgCountry: (org?.country as string | undefined) ?? undefined,
    });
  } catch (err) {
    console.error("[copilot] context enrichment failed", err);
    context = {
      locale,
      plan,
      orgName: (org?.name as string | undefined) ?? undefined,
      orgCountry: (org?.country as string | undefined) ?? undefined,
    };
  }
  const system = buildSystemPrompt({ passages, context });

  // --- 8. Compress old turns (keep last 8 full, summarise older) ------------
  const trimmed = trimHistory(messages, 8);

  // --- 9. Resolve / create the chat_session + persist user turn -------------
  const sessionId = await ensureSession({
    supabase,
    orgId,
    userId: user.id,
    existingId: payload.sessionId,
    firstUserText: latestQuery,
  });
  if (lastUser) {
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: latestQuery,
    });
  }

  // --- 10. Stream the response ---------------------------------------------
  const startedAt = Date.now();
  const modelMessages = await convertToModelMessages(trimmed);
  const tools = buildCopilotTools({ supabase, orgId, plan });
  const result = streamText({
    model: mistral(MISTRAL_CHAT_MODEL),
    system,
    messages: modelMessages,
    temperature: 0.3,
    tools,
    // Generous per-step output budget. A comprehensive answer to
    // "what does Article 13 require?" enumerating 12 essential
    // requirements + 7 vulnerability handling requirements + scope +
    // Seentrix steps easily runs past 3,000 tokens. The Mistral
    // provider's default can cut a long answer mid-word; 6,000 is
    // high enough for even the longest legitimate answer while
    // staying inside Mistral Large's per-completion ceiling.
    maxOutputTokens: 6000,
    // Let the model chain up to 12 steps in one turn. A guided
    // onboarding walk-through ("where do I start?") emits roughly
    // 6 `linkToPage` tool calls interleaved with prose, so the old
    // limit of 5 was cutting answers mid-sentence and surfacing as
    // the "Something went wrong" banner in the drawer. 12 leaves
    // headroom for tool-heavy answers (searchProducts →
    // getProductStatus → listOverdueItems + 5-6 link buttons +
    // closing prose) without letting the model thrash.
    stopWhen: stepCountIs(12),
    onError: ({ error }) => {
      const e = error as {
        message?: string;
        statusCode?: number;
        url?: string;
        responseBody?: unknown;
      };
      console.error("[copilot] streamText error", {
        message: e?.message,
        statusCode: e?.statusCode,
        url: e?.url,
        responseBody: e?.responseBody,
      });
    },
    onFinish: async ({ text, usage, finishReason, steps }) => {
      // Persist the assistant's final text + usage for auditability and to
      // power the "usage" view in settings. Failures here are logged but
      // don't break the response already delivered to the user.
      console.log("[copilot] finished", {
        finishReason,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        totalTokens: usage?.totalTokens,
        stepCount: steps?.length,
        textLength: text.length,
        latencyMs: Date.now() - startedAt,
      });
      try {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: text,
          retrieved_sections: passages
            .map((p) => (p.section ? `${p.doc_id}#${p.section}` : p.doc_id))
            .slice(0, 8),
          // Mark turns that fell through to the "I don't know" path so
          // the admin review page can surface them as KB-gap candidates.
          no_retrieval: passages.length === 0,
          token_usage_in: usage?.inputTokens ?? null,
          token_usage_out: usage?.outputTokens ?? null,
          latency_ms: Date.now() - startedAt,
        });
      } catch (err) {
        console.error("[copilot] persist failed", err);
      }
    },
  });

  // UIMessageStream handshake — headers + SSE chunks matching AI SDK v6.
  const res = result.toUIMessageStreamResponse();
  res.headers.set("x-copilot-session", sessionId);
  res.headers.set("x-copilot-remaining", String(quota.remaining));
  return res;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(m: UIMessage): string {
  // UIMessage parts are an array; for the current Copilot we only emit
  // plain text parts. If a tool part sneaks through, we skip it.
  if (!m.parts) return "";
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

/**
 * Keep the last `keep` turns verbatim. Compress older ones into a single
 * synthetic system note so the model still has a gist of earlier context
 * without paying for every token.
 */
function trimHistory(messages: UIMessage[], keep: number): UIMessage[] {
  if (messages.length <= keep) return messages;
  const older = messages.slice(0, messages.length - keep);
  const newer = messages.slice(messages.length - keep);
  const summaryText = older
    .map((m) => {
      const t = extractText(m).replace(/\s+/g, " ").slice(0, 140);
      return `- ${m.role}: ${t}`;
    })
    .join("\n");
  const summary: UIMessage = {
    id: "copilot-history-summary",
    role: "system",
    parts: [
      {
        type: "text",
        text: `Earlier conversation (summarised):\n${summaryText}`,
      },
    ],
  };
  return [summary, ...newer];
}

async function ensureSession({
  supabase,
  orgId,
  userId,
  existingId,
  firstUserText,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string;
  userId: string;
  existingId: string | undefined;
  firstUserText: string;
}): Promise<string> {
  if (existingId) {
    // Touch updated_at so "recent" ordering reflects activity.
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existingId);
    return existingId;
  }
  const title = firstUserText.slice(0, 80) || "New conversation";
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ org_id: orgId, user_id: userId, title })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`failed to create chat_session: ${error?.message}`);
  }
  return data.id as string;
}
