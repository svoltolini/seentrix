import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * One-time admin upgrade endpoint.
 * Upgrades the authenticated user to admin role + enterprise plan.
 * DELETE THIS FILE after use.
 *
 * Usage: GET /api/admin/upgrade
 */
export async function GET() {
  const TARGET_EMAIL = "samuel.voltolini@icloud.com";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.email !== TARGET_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgId = user.app_metadata?.org_id as string | undefined;

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  // 1. Upgrade user role to admin
  const { error: userError } = await supabase
    .from("users")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json(
      { error: "Failed to update user role", details: userError.message },
      { status: 500 }
    );
  }

  // 2. Upgrade organization plan to enterprise
  const { error: orgError } = await supabase
    .from("organizations")
    .update({ plan: "enterprise" })
    .eq("id", orgId);

  if (orgError) {
    return NextResponse.json(
      { error: "Failed to update org plan", details: orgError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Upgraded to admin + enterprise plan",
    user_id: user.id,
    org_id: orgId,
  });
}
