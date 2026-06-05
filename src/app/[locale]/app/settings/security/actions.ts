"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Security settings server actions.
 *
 * `snoozeMfaEnrolment` implements the "soft grace" part of mandatory 2FA: the
 * user can choose "Remind me later" instead of enrolling right now. We drop a
 * short-lived, session-scoped `2fa_grace` cookie that the middleware checks to
 * skip the enrolment redirect. It's intentionally a *session* cookie (no
 * `maxAge`/`expires`) so it clears when the browser session ends — the user is
 * nudged again next time, and a persistent in-app banner keeps reminding them
 * meanwhile.
 */
export async function snoozeMfaEnrolment(): Promise<void> {
  const store = await cookies();
  store.set("2fa_grace", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // No maxAge/expires → session cookie. Cleared when the browser closes.
  });
}

/**
 * Clears the grace cookie. Called after a user successfully enrols so the
 * (now-satisfied) gate logic doesn't keep an unnecessary cookie around.
 */
export async function clearMfaGrace(): Promise<void> {
  const store = await cookies();
  store.delete("2fa_grace");
}

/**
 * Remove every *unverified* TOTP factor for the current user.
 *
 * Abandoning the QR step (Cancel, navigating away, a failed verify) leaves a
 * half-enrolled factor behind in Supabase. A subsequent `enroll` then fails
 * with "a factor with the friendly name ... already exists" — including the
 * empty-string name. Cleaning up client-side via `supabase.auth.mfa.unenroll`
 * proved unreliable (it can require AAL2 and races the next enroll), so we do
 * it server-side with the service-role admin client, which bypasses those
 * constraints. Verified factors are never touched.
 *
 * Returns the number of stale factors removed (for debugging/telemetry).
 */
export async function clearUnverifiedMfaFactors(): Promise<{ removed: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { removed: 0 };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({
    userId: user.id,
  });
  if (error || !data) return { removed: 0 };

  const stale = data.factors.filter(
    (f) => f.factor_type === "totp" && f.status !== "verified",
  );
  let removed = 0;
  for (const f of stale) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({
      id: f.id,
      userId: user.id,
    });
    if (!delErr) removed += 1;
  }
  return { removed };
}
