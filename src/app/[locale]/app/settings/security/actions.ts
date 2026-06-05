"use server";

import { cookies } from "next/headers";

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
