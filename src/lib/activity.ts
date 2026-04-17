import { createClient } from "@/lib/supabase/server";

/**
 * Log an activity entry for the current user's organization.
 * Call after each successful mutation in server actions.
 *
 * Action naming convention: entity.verb
 * e.g. "member.created", "product.deleted", "document.saved"
 */
export async function logActivity(params: {
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const orgId = user.app_metadata?.org_id as string | undefined;
    if (!orgId) return;

    // Resolve actor name/email from users table
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("activities").insert({
      org_id: orgId,
      actor_id: user.id,
      actor_name: (profile as { full_name: string | null; email: string } | null)?.full_name ?? null,
      actor_email: (profile as { full_name: string | null; email: string } | null)?.email ?? user.email,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      target_name: params.targetName ?? null,
      metadata: params.metadata ?? {},
    });

    if (error && process.env.NODE_ENV === "development") {
      console.error("[logActivity]", error.message);
    }
  } catch (err) {
    // Activity logging is best-effort — never block the main action
    if (process.env.NODE_ENV === "development") {
      console.error("[logActivity]", err);
    }
  }
}
