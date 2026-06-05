"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_USER_LIMITS } from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";

export type ActionResult = { error?: string } | undefined;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, orgId: null };

  const orgId = user.app_metadata?.org_id as string | undefined;
  return { supabase, user, orgId: orgId ?? null };
}

const VALID_ROLES = [
  "admin",
  "compliance_officer",
  "cto",
  "editor",
  "viewer",
] as const;

// ---------------------------------------------------------------------------
// Organization settings
// ---------------------------------------------------------------------------

export interface OrgSettings {
  id: string;
  name: string;
  plan: OrgPlan;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  legal_name: string | null;
  registration_number: string | null;
  signatory_name: string | null;
  signatory_position: string | null;
  contact_email: string | null;
  website: string | null;
  onboarding_completed: boolean;
}

export async function loadOrgSettings(): Promise<OrgSettings | null> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return null;

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (!data) return null;

  const record = data as Record<string, unknown>;
  return {
    id: orgId,
    name: (record.name as string) ?? "",
    plan: ((record.plan as string) ?? "free") as OrgPlan,
    address_line1: (record.address_line1 as string) ?? null,
    address_line2: (record.address_line2 as string) ?? null,
    postal_code: (record.postal_code as string) ?? null,
    city: (record.city as string) ?? null,
    country: (record.country as string) ?? null,
    legal_name: (record.legal_name as string) ?? null,
    registration_number: (record.registration_number as string) ?? null,
    signatory_name: (record.signatory_name as string) ?? null,
    signatory_position: (record.signatory_position as string) ?? null,
    contact_email: (record.contact_email as string) ?? null,
    website: (record.website as string) ?? null,
    onboarding_completed: !!record.onboarding_completed,
  };
}

export async function updateOrganization(
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "nameRequired" };

  const updateData: Record<string, unknown> = { name };

  // Read every optional field from the form; NULL out blanks so the DB
  // matches the UI state exactly. All "required-for-DoC" fields live here
  // too — the gate in issueDeclaration enforces their presence at use-time.
  const setIfPresent = (key: string, dbCol?: string) => {
    const raw = formData.get(key);
    if (raw === null) return;
    const value = typeof raw === "string" ? raw.trim() : null;
    updateData[dbCol ?? key] = value ? value : null;
  };

  setIfPresent("address_line1");
  setIfPresent("address_line2");
  setIfPresent("postal_code");
  setIfPresent("city");
  setIfPresent("country");
  setIfPresent("legal_name");
  setIfPresent("registration_number");
  setIfPresent("signatory_name");
  setIfPresent("signatory_position");
  setIfPresent("contact_email");
  setIfPresent("website");

  const { error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", orgId);

  if (error) return { error: "generic" };

  await logActivity({ action: "organization.updated", targetType: "organization", targetId: orgId, targetName: name });

  return {};
}

// ---------------------------------------------------------------------------
// Company profile completeness — used by the dashboard banner + DoC gate.
// Keep the list in sync with DOC_REQUIRED_ORG_FIELDS in the conformity
// action. Returns the list of missing field keys so the UI can deep-link.
// ---------------------------------------------------------------------------

export interface CompanyProfileStatus {
  complete: boolean;
  missing: string[];
}

const COMPANY_PROFILE_REQUIRED: (keyof OrgSettings)[] = [
  "legal_name",
  "registration_number",
  "address_line1",
  "postal_code",
  "city",
  "country",
  "signatory_name",
  "signatory_position",
  "contact_email",
];

export async function getCompanyProfileStatus(): Promise<CompanyProfileStatus> {
  const org = await loadOrgSettings();
  if (!org) return { complete: false, missing: COMPANY_PROFILE_REQUIRED };
  const missing = COMPANY_PROFILE_REQUIRED.filter((key) => {
    const value = org[key];
    return typeof value !== "string" || value.trim() === "";
  });
  return { complete: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return [];

  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, role, is_active, must_change_password, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  return (data as TeamMember[]) ?? [];
}

export async function removeTeamMember(
  memberId: string
): Promise<ActionResult> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin") return { error: "notAdmin" };

  if (memberId === user.id) return { error: "cantRemoveSelf" };

  // SECURITY: verify the target user is in the caller's org BEFORE the
  // admin-client delete. Without this check, an admin in any org could pass
  // another org's user UUID and the service-role-key deleteUser call would
  // wipe that user's auth row — cascading through public.users.
  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("id", memberId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!target) return { error: "notFound" };

  // Delete the auth user via admin client (bypasses RLS). Safe now that we
  // confirmed membership above.
  const adminSupabase = createAdminClient();
  await adminSupabase.auth.admin.deleteUser(memberId);

  // The profile row cascades from the auth delete, but we re-run the delete
  // to keep the RLS path intact in case of stale auth.users references.
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) return { error: "generic" };

  await logActivity({ action: "member.removed", targetType: "member", targetId: memberId });

  return {};
}

// ---------------------------------------------------------------------------
// Current user role
// ---------------------------------------------------------------------------

export async function getCurrentUserRole(): Promise<string | null> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return null;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return (data as { role: string } | null)?.role ?? null;
}

// ---------------------------------------------------------------------------
// Create member (admin creates account directly)
// ---------------------------------------------------------------------------

export async function createMember(
  email: string,
  fullName: string,
  role: string,
  tempPassword: string
): Promise<{ error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  // Verify caller is admin
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin") return { error: "notAdmin" };

  // Validate role
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: "invalidRole" };
  }

  // Validate password length
  if (!tempPassword || tempPassword.length < 8) {
    return { error: "passwordTooShort" };
  }

  // Check plan limit
  const org = await loadOrgSettings();
  if (!org) return { error: "generic" };

  const limit = PLAN_USER_LIMITS[org.plan];
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if ((userCount ?? 0) >= limit) {
    return { error: "limitReached" };
  }

  // Create auth user via admin API (no email confirmation needed)
  const adminSupabase = createAdminClient();
  const { data: newUser, error: createError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        org_id: orgId,
        must_change_password: true,
      },
      user_metadata: {
        full_name: fullName,
      },
    });

  if (createError) {
    if (createError.message?.toLowerCase().includes("already")) {
      return { error: "emailInUse" };
    }
    return { error: "generic" };
  }

  if (!newUser?.user) return { error: "generic" };

  // Insert into users table
  const { error: insertError } = await adminSupabase.from("users").insert({
    id: newUser.user.id,
    org_id: orgId,
    email,
    full_name: fullName,
    role,
    must_change_password: true,
    is_active: true,
  });

  if (insertError) {
    // Rollback: delete the auth user we just created
    await adminSupabase.auth.admin.deleteUser(newUser.user.id);
    return { error: "generic" };
  }

  await logActivity({ action: "member.created", targetType: "member", targetId: newUser.user.id, targetName: fullName, metadata: { email, role } });

  return {};
}

// ---------------------------------------------------------------------------
// Role management
// ---------------------------------------------------------------------------

export async function updateMemberRole(
  memberId: string,
  newRole: string
): Promise<ActionResult> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin") return { error: "notAdmin" };

  if (!VALID_ROLES.includes(newRole as (typeof VALID_ROLES)[number])) {
    return { error: "invalidRole" };
  }

  if (memberId === user.id) return { error: "cantChangeOwnRole" };

  // Prevent demoting the last admin
  if (newRole !== "admin") {
    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", memberId)
      .single();

    if ((target as { role: string } | null)?.role === "admin") {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("role", "admin");

      if ((count ?? 0) <= 1) return { error: "lastAdmin" };
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) return { error: "generic" };

  await logActivity({ action: "member.role_changed", targetType: "member", targetId: memberId, metadata: { newRole } });

  return {};
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface AccountInfo {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export async function loadAccount(): Promise<AccountInfo | null> {
  const { supabase, user } = await getAuthContext();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name ?? "",
    avatarUrl: (data as { avatar_url: string | null } | null)?.avatar_url ?? null,
  };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const fullName = (formData.get("fullName") as string)?.trim();
  if (!fullName) return { error: "nameRequired" };

  // Handle avatar upload.
  //
  // The upload runs through the service-role client, NOT the user's RLS
  // client. The project signs user sessions with asymmetric (ES256) JWTs,
  // which the Storage service does not validate against the legacy HS256
  // secret — so a user-scoped storage upload is rejected with a 403
  // "row violates row-level security policy" even though the path is correct.
  // The service-role client bypasses RLS; we still scope the object path to
  // `${user.id}/...` (the verified, server-side user id) so a user can only
  // ever write their own avatar.
  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const admin = createAdminClient();
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

    if (uploadError) {
      // Surface the failure instead of silently saving only the name — the
      // user explicitly tried to set a picture, so a silent success is
      // misleading.
      console.error("[updateProfile] avatar upload failed", uploadError);
      return { error: "avatarUploadFailed" };
    }

    const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new image shows immediately rather than serving the
    // previously-cached avatar at the same path.
    avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (error) return { error: "generic" };

  const updateData: Record<string, unknown> = { full_name: fullName };
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

  const { error: dbError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (dbError) return { error: "generic" };

  await logActivity({ action: "profile.updated", targetType: "user", targetId: user.id });

  // Refresh the app shell so the topbar avatar + name pick up the change.
  revalidatePath("/app", "layout");

  return {};
}

export async function changePassword(
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "passwordTooShort" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { error: "generic" };

  await logActivity({ action: "password.changed", targetType: "user", targetId: user.id });

  return {};
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export interface Activity {
  id: string;
  actor_id: string;
  actor_name: string | null;
  actor_email: string | null;
  actor_avatar_url: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function listActivities(): Promise<Activity[]> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return [];

  const { data } = await supabase
    .from("activities")
    .select("id, actor_id, actor_name, actor_email, action, target_type, target_id, target_name, metadata, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];

  // Resolve avatar URLs from users table
  const actorIds = [...new Set(data.map((a) => a.actor_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, avatar_url")
    .in("id", actorIds);

  const avatarMap: Record<string, string | null> = {};
  for (const u of (users ?? []) as { id: string; avatar_url: string | null }[]) {
    avatarMap[u.id] = u.avatar_url;
  }

  return data.map((a) => ({
    ...(a as Omit<Activity, "actor_avatar_url">),
    actor_avatar_url: avatarMap[a.actor_id] ?? null,
  }));
}

export async function exportActivities(months: number = 12): Promise<string> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return "";

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data } = await supabase
    .from("activities")
    .select("actor_name, actor_email, action, target_type, target_name, metadata, created_at")
    .eq("org_id", orgId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as {
    actor_name: string | null;
    actor_email: string | null;
    action: string;
    target_type: string | null;
    target_name: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];

  const escape = (v: string | null) => {
    if (!v) return "";
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const header = "Date,Actor,Email,Action,Target Type,Target Name,Details";
  const lines = rows.map((r) =>
    [
      r.created_at,
      escape(r.actor_name),
      escape(r.actor_email),
      r.action,
      r.target_type ?? "",
      escape(r.target_name),
      escape(JSON.stringify(r.metadata)),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}
