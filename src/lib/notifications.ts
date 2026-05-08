"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight server action used by the topbar's `<NotificationsMenu />`.
 *
 * Returns the latest 10 activity rows for the current user's org, with
 * actor display details joined in. Mirrors the activity-fetch logic in
 * `getDashboardStats` but kept narrow so opening the bell popover
 * doesn't pull the full dashboard payload.
 *
 * No "unread" tracking server-side yet — the bell badge is computed
 * client-side against a localStorage `lastSeenAt` timestamp. Good
 * enough for MVP; promoting to a real notifications table with
 * `read_at` per recipient is a separate ticket.
 */
export interface NotificationItem {
  id: string;
  /** Dot-notation action key (`product.created`, `member.removed`, …). */
  action: string;
  /** Optional target name (product, member full name, file name). */
  target_name: string | null;
  /** ISO timestamp. */
  created_at: string;
  /** Display name of the user who triggered the event. */
  user_name: string | null;
  /** Avatar URL for the actor (joined from `users.avatar_url`). */
  user_avatar_url: string | null;
}

export async function getRecentNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return [];

  // Round 1 — pull the activity rows.
  const { data: activityRows } = await supabase
    .from("activities")
    .select(
      "id, actor_id, actor_name, action, target_type, target_name, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!activityRows || activityRows.length === 0) return [];

  // Round 2 — resolve actor display details for any activities whose
  // `actor_name` was not denormalised at write time. Keeps the response
  // joined-but-fast (one extra query keyed on a small list of IDs).
  const actorIds = [
    ...new Set(
      (activityRows as Array<{ actor_id: string | null }>)
        .map((r) => r.actor_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const actorMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", actorIds);
    for (const a of (actors ?? []) as Array<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }>) {
      actorMap[a.id] = { full_name: a.full_name, avatar_url: a.avatar_url };
    }
  }

  return (activityRows as Array<{
    id: string;
    actor_id: string | null;
    actor_name: string | null;
    action: string;
    target_name: string | null;
    created_at: string;
  }>).map((row) => {
    const actor = row.actor_id ? actorMap[row.actor_id] : null;
    return {
      id: row.id,
      action: row.action,
      target_name: row.target_name,
      created_at: row.created_at,
      user_name: actor?.full_name ?? row.actor_name ?? null,
      user_avatar_url: actor?.avatar_url ?? null,
    };
  });
}
