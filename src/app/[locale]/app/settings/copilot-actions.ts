"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";

/**
 * Delete every Copilot chat_session (and therefore every chat_message) for
 * the currently authenticated user. Used by the "Clear history" affordance
 * on the Copilot drawer — the delete is scoped to the single user per RLS.
 */
export async function clearCopilotHistory(): Promise<{
  ok: boolean;
  deleted?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Count first so we can report it back in the toast.
  const { count } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, deleted: count ?? 0 };
}
