import "server-only";

import { getServiceClient } from "./service";
import type { PlatformStaff } from "./access";

/**
 * Append a row to `admin_audit`. Best-effort: a logging failure must never
 * block the staff action itself, but we surface it in dev. Call this after
 * any console action worth a paper trail — viewing a customer, issuing a
 * refund, granting an add-on, impersonating, editing the staff list.
 *
 * Action naming mirrors the customer activity log: entity.verb, e.g.
 * "org.viewed", "billing.refunded", "staff.added".
 */
export async function logAdminAction(
  actor: Pick<PlatformStaff, "userId" | "email">,
  input: {
    action: string;
    targetType?: string;
    targetId?: string;
    targetOrgId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const { error } = await getServiceClient().from("admin_audit").insert({
      actor_id: actor.userId,
      actor_email: actor.email,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      target_org_id: input.targetOrgId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error && process.env.NODE_ENV === "development") {
      console.error("[logAdminAction]", error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[logAdminAction]", err);
    }
  }
}
