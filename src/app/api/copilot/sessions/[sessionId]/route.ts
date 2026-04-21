import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET  /api/copilot/sessions/[sessionId] — return the transcript of a
 *                                         single past session (role + content
 *                                         per turn).
 * DELETE /api/copilot/sessions/[sessionId] — remove a single past session.
 *                                           chat_messages + chat_feedback
 *                                           cascade via the existing FKs.
 *
 * RLS on chat_sessions + chat_messages is the security layer — a user
 * can only touch rows scoped to their org_id + user_id pair.
 */

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Pull the session + messages in parallel. Messages already order by
  // created_at via their index.
  const [{ data: session }, { data: messages, error }] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true }),
  ]);

  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session, messages: messages ?? [] });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
