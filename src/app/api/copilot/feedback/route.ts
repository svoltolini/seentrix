import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/copilot/feedback
 *
 * Record a thumbs-up / thumbs-down on a Copilot assistant message.
 *
 * Payload:
 * {
 *   sessionId:        UUID of the chat_session,
 *   clientMessageId:  AI SDK's UIMessage.id for the assistant turn,
 *   rating:           -1 | 1 | null (null = un-rate),
 *   comment?:         optional freetext on 👎,
 *   question?:        the user turn's text (snapshotted),
 *   answer?:          the assistant turn's text (snapshotted),
 * }
 *
 * RLS on chat_feedback enforces that the session belongs to the user's
 * org + user_id pair — the API doesn't need to do that check itself.
 */

export const runtime = "nodejs";

interface Payload {
  sessionId: string;
  clientMessageId: string;
  rating: -1 | 1 | null;
  comment?: string;
  question?: string;
  answer?: string;
  retrievedSections?: string[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.sessionId || !payload.clientMessageId) {
    return NextResponse.json(
      { error: "missing_session_or_message_id" },
      { status: 400 },
    );
  }
  if (
    payload.rating !== null &&
    payload.rating !== -1 &&
    payload.rating !== 1
  ) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }

  // Null rating ⇒ delete any existing row (user "un-rated").
  if (payload.rating === null) {
    const { error } = await supabase
      .from("chat_feedback")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", payload.sessionId)
      .eq("client_message_id", payload.clientMessageId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, rating: null });
  }

  // Upsert — unique (user_id, session_id, client_message_id) means the
  // conflict path updates the rating + comment rather than inserting a
  // duplicate row.
  const { error } = await supabase
    .from("chat_feedback")
    .upsert(
      {
        user_id: user.id,
        session_id: payload.sessionId,
        client_message_id: payload.clientMessageId,
        rating: payload.rating,
        comment: payload.comment?.trim() || null,
        question: payload.question ?? null,
        answer: payload.answer ?? null,
        retrieved_sections: payload.retrievedSections ?? [],
      },
      { onConflict: "user_id,session_id,client_message_id" },
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rating: payload.rating });
}
