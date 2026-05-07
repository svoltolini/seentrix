import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCopilotAdmin } from "@/lib/copilot/admin-access";

/**
 * Staff-only review page for Copilot quality.
 *
 * Three sections:
 *
 *   1. At-a-glance counters (👍 / 👎 / no-retrieval rate over 30 days).
 *   2. The last 50 👎 — each with the user question, full answer, which
 *      KB sections were retrieved, and the freetext comment. This is
 *      the single most important screen for fixing the product.
 *   3. KB-gap candidates — assistant turns where retrieval returned
 *      zero passages. Signals missing corpus content.
 *
 * Gated by the COPILOT_ADMIN_EMAILS env var allowlist. Anyone else sees
 * a 404 (not a redirect — we don't want to leak that the page exists).
 */

export const runtime = "nodejs";
// We read from a service-role client to see across orgs — this page
// is a Seentrix-staff tool, not a customer-facing one.
import { createClient as createServiceClient } from "@supabase/supabase-js";

export default async function CopilotAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (!isCopilotAdmin(user.email ?? null)) notFound();

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceUrl || !serviceKey) {
    throw new Error(
      "Supabase service credentials missing — set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  const svc = createServiceClient(serviceUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ---- Counters: last 30 days ---------------------------------------------
  // This is a fully-dynamic admin page (DB read per request), so a
  // time-based window is fine. The rule flags impure calls in RSC
  // because they prevent prerendering — not a concern for a staff-only
  // dashboard.
  // eslint-disable-next-line react-hooks/purity
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: thumbsUp },
    { count: thumbsDown },
    { count: totalAssistant },
    { count: noRetrieval },
    { data: recentNegatives },
    { data: gapCandidates },
  ] = await Promise.all([
    svc
      .from("chat_feedback")
      .select("*", { count: "exact", head: true })
      .eq("rating", 1)
      .gte("created_at", sinceIso),
    svc
      .from("chat_feedback")
      .select("*", { count: "exact", head: true })
      .eq("rating", -1)
      .gte("created_at", sinceIso),
    svc
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", sinceIso),
    svc
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "assistant")
      .eq("no_retrieval", true)
      .gte("created_at", sinceIso),
    svc
      .from("chat_feedback")
      .select(
        "id, rating, comment, question, answer, retrieved_sections, created_at, session_id",
      )
      .eq("rating", -1)
      .order("created_at", { ascending: false })
      .limit(50),
    svc
      .from("chat_messages")
      .select("id, content, created_at, session_id")
      .eq("role", "assistant")
      .eq("no_retrieval", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const thumbUpCount = thumbsUp ?? 0;
  const thumbDownCount = thumbsDown ?? 0;
  const totalAssistantCount = totalAssistant ?? 0;
  const noRetrievalCount = noRetrieval ?? 0;
  const negatives =
    (recentNegatives as ThumbsDownRow[] | null) ?? ([] as ThumbsDownRow[]);
  const gaps =
    (gapCandidates as GapRow[] | null) ?? ([] as GapRow[]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 py-4">
      <header className="flex flex-col gap-2">
        <span className="text-l6-plus uppercase tracking-[0.18em] text-[#066DE6]">
          Copilot · staff review
        </span>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Copilot feedback
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-org diagnostics for the last 30 days. Use this to decide
          what corpus content to add or what prompt rule to tighten.
        </p>
      </header>

      {/* ---- Counters ---------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Assistant turns" value={totalAssistantCount} />
        <StatCard
          label="Thumbs up"
          value={thumbUpCount}
          accent="text-emerald-400"
        />
        <StatCard
          label="Thumbs down"
          value={thumbDownCount}
          accent="text-rose-400"
        />
        <StatCard
          label="No-retrieval turns"
          value={noRetrievalCount}
          accent="text-amber-400"
          sub={
            totalAssistantCount
              ? `${Math.round((noRetrievalCount / totalAssistantCount) * 100)}%`
              : undefined
          }
        />
      </section>

      {/* ---- Thumbs-down list ------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Recent 👎 ({negatives.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Snapshot of question + answer at rating time — survives
            transcript retention purges.
          </p>
        </div>
        {negatives.length === 0 ? (
          <EmptyPanel text="No thumbs-down in the last 30 days. 🎉" />
        ) : (
          <div className="flex flex-col gap-3">
            {negatives.map((row) => (
              <FeedbackRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      {/* ---- KB gaps ----------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">
            KB-gap candidates ({gaps.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Assistant turns where retrieval returned zero passages.
          </p>
        </div>
        {gaps.length === 0 ? (
          <EmptyPanel text="No KB gaps in the last 30 days." />
        ) : (
          <div className="flex flex-col gap-3">
            {gaps.map((row) => (
              <GapRowView key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types + presentational components
// ---------------------------------------------------------------------------

interface ThumbsDownRow {
  id: string;
  rating: number;
  comment: string | null;
  question: string | null;
  answer: string | null;
  retrieved_sections: string[];
  created_at: string;
  session_id: string;
}

interface GapRow {
  id: string;
  content: string;
  created_at: string;
  session_id: string;
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md bg-muted p-4 ring-1 ring-white/[0.06]">
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-2xl font-semibold ${
          accent ?? "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function FeedbackRow({ row }: { row: ThumbsDownRow }) {
  return (
    <article className="flex flex-col gap-3 rounded-md bg-muted p-4 ring-1 ring-white/[0.06]">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(row.created_at).toLocaleString()}</span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          session {row.session_id.slice(0, 8)}
        </code>
      </header>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Question
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {row.question || "—"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Answer
        </p>
        <p className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm text-foreground/90">
          {row.answer || "—"}
        </p>
      </div>
      {row.retrieved_sections.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Retrieved
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {row.retrieved_sections.map((s) => (
              <span
                key={s}
                className="rounded bg-[#066DE6]/15 px-2 py-0.5 text-l6-plus text-[#93C5FD]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {row.comment && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            User comment
          </p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-rose-500/8 px-3 py-2 text-sm text-rose-200 ring-1 ring-rose-500/20">
            {row.comment}
          </p>
        </div>
      )}
    </article>
  );
}

function GapRowView({ row }: { row: GapRow }) {
  return (
    <article className="flex flex-col gap-2 rounded-md bg-muted p-4 ring-1 ring-white/[0.06]">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(row.created_at).toLocaleString()}</span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          session {row.session_id.slice(0, 8)}
        </code>
      </header>
      <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90">
        {row.content}
      </p>
    </article>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground ring-1 ring-white/[0.04]">
      {text}
    </div>
  );
}

export const metadata = { title: "Copilot admin" };
