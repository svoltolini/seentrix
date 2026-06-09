import "server-only";

import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { getServiceClient } from "./service";

/**
 * Platform-staff gate for the internal admin console.
 *
 * Membership in `platform_staff` is the ONLY thing that unlocks /admin.
 * It is intentionally unrelated to the org-level `users.role` — an org admin
 * runs their own company and must never reach a cross-tenant tool.
 *
 * MFA: the console lives under /app, and the middleware already enforces AAL2
 * (TOTP) for every /app route, so a staff session is guaranteed MFA-verified
 * by the time it gets here.
 *
 * Denial is a 404 (`notFound()`), never a redirect — we don't advertise that
 * the console exists to anyone who isn't staff.
 */

export type PlatformRole = "owner" | "staff";

export interface PlatformStaff {
  userId: string;
  email: string;
  role: PlatformRole;
}

interface StaffRow {
  user_id: string;
  email: string;
  role: PlatformRole;
}

/** Resolve the current session's staff record, or null if they aren't staff. */
export async function getPlatformStaff(): Promise<PlatformStaff | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const { data } = await getServiceClient()
    .from("platform_staff")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle<StaffRow>();

  if (!data) return null;
  return { userId: data.user_id, email: data.email, role: data.role };
}

/** Require platform staff; 404 otherwise. Returns the staff record. */
export async function requirePlatformStaff(): Promise<PlatformStaff> {
  const staff = await getPlatformStaff();
  if (!staff) notFound();
  return staff;
}

/** Require an owner specifically (staff-list management, destructive ops). */
export async function requirePlatformOwner(): Promise<PlatformStaff> {
  const staff = await requirePlatformStaff();
  if (staff.role !== "owner") notFound();
  return staff;
}
