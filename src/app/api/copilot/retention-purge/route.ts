import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PLAN_COPILOT_RETENTION_DAYS } from "@/lib/constants/plans";

/**
 * GET /api/copilot/retention-purge
 *
 * Scheduled daily by Vercel Cron (see vercel.json). Walks every plan
 * tier and deletes chat_sessions older than the tier's retention
 * window — chat_messages + chat_feedback cascade. The job is
 * idempotent: deleting the same rows twice is a no-op.
 *
 * Authenticated via the CRON_SECRET env var. Vercel's cron agent sends
 * `Authorization: Bearer <CRON_SECRET>`; any other caller sees 401.
 */

export const runtime = "nodejs";

export async function GET(req: Request) {
  // 1. Auth — either Vercel Cron or a manual trigger with the secret.
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Service client — we're sweeping across every org.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "supabase_credentials_missing" },
      { status: 500 },
    );
  }
  const svc = createServiceClient(url, key, {
    auth: { persistSession: false },
  });

  // 3. Walk each plan tier and delete chat_sessions whose updated_at
  //    is older than the tier's retention window. We key on sessions
  //    (not messages) because a long-running session should be kept
  //    alive by recent activity — `updated_at` on chat_sessions is
  //    bumped on every new turn.
  const summary: Record<string, { deleted: number; error?: string }> = {};

  for (const [plan, days] of Object.entries(PLAN_COPILOT_RETENTION_DAYS)) {
    if (days === Infinity) {
      summary[plan] = { deleted: 0 };
      continue;
    }

    const cutoff = new Date(
      Date.now() - (days as number) * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Two-step: find the org ids for this plan, then delete the sessions
    // belonging to them. Single-query joins via PostgREST are awkward
    // for cross-table filters so we just do two cheap requests.
    const { data: orgs } = await svc
      .from("organizations")
      .select("id")
      .eq("plan", plan);
    const orgIds = (orgs as { id: string }[] | null)?.map((o) => o.id) ?? [];
    if (orgIds.length === 0) {
      summary[plan] = { deleted: 0 };
      continue;
    }

    const { data: deleted, error } = await svc
      .from("chat_sessions")
      .delete()
      .in("org_id", orgIds)
      .lt("updated_at", cutoff)
      .select("id");

    if (error) {
      summary[plan] = { deleted: 0, error: error.message };
      continue;
    }
    summary[plan] = { deleted: (deleted ?? []).length };
  }

  return NextResponse.json({
    ok: true,
    ran_at: new Date().toISOString(),
    summary,
  });
}
