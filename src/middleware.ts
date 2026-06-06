import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { LOCALE_COOKIE, isLocale } from "./i18n/locales";
import { createClient } from "./lib/supabase/middleware";

/**
 * Auth + routing middleware.
 *
 * Runs on every non-static request. Responsibilities:
 *   1. Refresh the Supabase session via `supabase.auth.getUser()` and
 *      forward the rotated cookies on the response.
 *   2. Gate auth-aware routes (login redirect, MFA elevation,
 *      must-change-password, must-complete-training, onboarding).
 *   3. Run next-intl's middleware so `useTranslations()` /
 *      `getTranslations()` have the locale set on the request (always
 *      `"en"` — Seentrix is English-only — but the wiring still has to
 *      exist for the message loader).
 *
 * URL paths are NOT locale-prefixed (`localePrefix: "never"` in routing),
 * so `pathname` reads as plain `/auth/login`, `/app/dashboard`, etc.
 */
const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session
  const { supabase, response: supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1b. Non-localized route handlers must bypass the next-intl middleware.
  // `/auth/callback` is a route handler living at src/app/auth/callback/
  // (outside the [locale] tree). If it falls through to intlMiddleware at
  // the bottom, next-intl tries to resolve it as a localized *page*, finds
  // none, and returns 404 — which is exactly what breaks the email
  // confirmation link. Short-circuit here and return the Supabase response
  // (session cookies already refreshed above) so Next routes straight to
  // the handler.
  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  // 2. Classify the request by path. Plain paths (no /en/ prefix).
  const isAppRoute = pathname.startsWith("/app");
  const isOnboardingRoute = pathname.startsWith("/auth/onboarding");
  const isChangePasswordRoute = pathname.startsWith("/auth/change-password");
  const isMfaChallengeRoute = pathname.startsWith("/auth/mfa");
  const isLoginOrSignup =
    pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

  // Academy is exempt from the training gate so users can actually reach
  // the lessons that unlock it.
  const isAcademyRoute = pathname.startsWith("/app/academy");

  // The Security settings page is where a user enrols in 2FA, so it must
  // never be gated by the 2FA-enrolment redirect (otherwise the redirect
  // would loop). The logout action lives under /auth too.
  const isSecurityRoute = pathname.startsWith("/app/settings/security");

  const orgId = user?.app_metadata?.org_id;
  const mustChangePassword = user?.app_metadata?.must_change_password === true;

  // Locale cookie sync. With `localePrefix: "never"`, next-intl resolves the
  // active language from the NEXT_LOCALE cookie. If an authed user has no such
  // cookie yet (e.g. just logged in, or set their language on another device),
  // hydrate it ONCE from their saved `preferred_locale`. The cookie's presence
  // means this DB read happens at most once per session — every later request
  // already has the cookie, so this stays cheap (mirrors the 2fa_enrolled
  // pattern). The user can override anytime via the language picker, which
  // writes both the row and the cookie.
  let localeCookieToSet: string | null = null;
  if (user && !request.cookies.get(LOCALE_COOKIE)) {
    const { data: profile } = await supabase
      .from("users")
      .select("preferred_locale")
      .eq("id", user.id)
      .maybeSingle();
    const pref = (profile as { preferred_locale?: string } | null)
      ?.preferred_locale;
    if (isLocale(pref) && pref !== "en") {
      localeCookieToSet = pref;
    }
  }
  const mustCompleteTraining =
    user?.app_metadata?.must_complete_training === true;

  // AAL gating — when a user has MFA enrolled, Supabase issues a session
  // at AAL1 (password only) after signInWithPassword. Bounce them to
  // /auth/mfa until they elevate to AAL2 (password + TOTP). The MFA API
  // is cheap (no DB round-trip — works off the JWT claims).
  let needsMfaChallenge = false;
  // 2FA-enrolment gate (soft grace). Seentrix requires every user to set up
  // two-factor auth. A user with no verified TOTP factor is redirected to the
  // Security settings page to enrol — UNLESS they've clicked "remind me later"
  // this session, which drops a short-lived `2fa_grace` cookie. A persistent
  // banner keeps nudging them. This is a soft gate: it never blocks the
  // Security page itself (where they enrol) and is bypassable for one session
  // at a time, so it can't lock anyone out.
  let needsMfaEnrolment = false;
  const hasGrace = request.cookies.get("2fa_grace")?.value === "1";
  // Perf: remember "this user has a verified TOTP factor" in a cookie so we
  // don't pay a `listFactors()` network round-trip to Supabase Auth on EVERY
  // navigation. Once enrolled, a user stays enrolled, so the cached flag is
  // safe; it's cleared on sign-out with the rest of the session cookies.
  const mfaEnrolledCookie = request.cookies.get("2fa_enrolled")?.value === "1";
  let setMfaEnrolledCookie = false;
  if (user && orgId) {
    // getAuthenticatorAssuranceLevel() reads the JWT claims — no network call,
    // so this stays cheap on every request.
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsMfaChallenge =
      aalData?.nextLevel === "aal2" && aalData.currentLevel === "aal1";

    // A user at AAL2 (or heading there) clearly has a verified factor.
    if (aalData?.nextLevel === "aal2") {
      if (!mfaEnrolledCookie) setMfaEnrolledCookie = true;
    } else if (
      aalData?.nextLevel === "aal1" &&
      aalData.currentLevel === "aal1"
    ) {
      // Only hit listFactors() when we DON'T already know they're enrolled
      // (no cached flag) and they haven't snoozed the gate. This collapses the
      // common case (already enrolled, or grace cookie set) to zero network
      // calls here.
      if (mfaEnrolledCookie || hasGrace) {
        needsMfaEnrolment = false;
      } else {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasVerifiedTotp = (factors?.totp ?? []).some(
          (f) => f.status === "verified",
        );
        needsMfaEnrolment = !hasVerifiedTotp;
        if (hasVerifiedTotp) setMfaEnrolledCookie = true;
      }
    }
  }

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  // 3. Redirect rules

  // Unauthed trying to access protected areas → login
  if (!user && (isAppRoute || isOnboardingRoute || isChangePasswordRoute)) {
    return redirectTo("/auth/login");
  }

  // Authed with must_change_password trying to access app routes → change password
  if (user && orgId && mustChangePassword && isAppRoute) {
    return redirectTo("/auth/change-password");
  }

  // MFA challenge — any authed user with a pending AAL2 requirement gets
  // bounced to the TOTP challenge before reaching app or settings. Also
  // applies to login/signup so a freshly-logged-in user can't linger
  // there after the MFA API has noticed they need to elevate.
  if (
    user &&
    orgId &&
    needsMfaChallenge &&
    !isMfaChallengeRoute &&
    (isAppRoute || isLoginOrSignup)
  ) {
    return redirectTo("/auth/mfa");
  }

  // Authed + already passed MFA but sitting on the challenge page → dashboard
  if (user && orgId && !needsMfaChallenge && isMfaChallengeRoute) {
    return redirectTo("/app/dashboard");
  }

  // 2FA-enrolment gate — authed user with no verified TOTP factor who hasn't
  // taken the "remind me later" grace is redirected to the Security page to
  // set up 2FA. Never applies to the Security page itself (to avoid a loop),
  // to the password-change / MFA-challenge flows, or to users still in the
  // training gate (one gate at a time). Settings sub-pages other than Security
  // are still gated so the redirect lands on the enrolment UI.
  if (
    user &&
    orgId &&
    !mustChangePassword &&
    !mustCompleteTraining &&
    !needsMfaChallenge &&
    needsMfaEnrolment &&
    !hasGrace &&
    isAppRoute &&
    !isSecurityRoute
  ) {
    return redirectTo("/app/settings/security?enroll=1");
  }

  // Authed with must_change_password trying to access login/signup → change password
  if (user && orgId && mustChangePassword && isLoginOrSignup) {
    return redirectTo("/auth/change-password");
  }

  // Authed without org trying to access app routes → onboarding
  if (user && !orgId && isAppRoute) {
    return redirectTo("/auth/onboarding");
  }

  // Authed with org (no password change needed) trying to access login/signup → dashboard
  if (user && orgId && !mustChangePassword && isLoginOrSignup) {
    return redirectTo("/app/dashboard");
  }

  // Authed with org trying to access onboarding → dashboard
  if (user && orgId && isOnboardingRoute) {
    return redirectTo("/app/dashboard");
  }

  // Authed with org but training not complete trying to access an app route
  // that isn't the Academy itself → redirect to Academy. The must_change_
  // password check above takes priority because a user with a pending
  // password change shouldn't see the Academy yet.
  if (
    user &&
    orgId &&
    !mustChangePassword &&
    mustCompleteTraining &&
    isAppRoute &&
    !isAcademyRoute
  ) {
    return redirectTo("/app/academy");
  }

  // 3b. If we resolved a preferred locale for this user, set the NEXT_LOCALE
  // cookie on the *request* so next-intl's middleware (run next) renders in
  // that language on this very request, not just subsequent ones.
  if (localeCookieToSet) {
    request.cookies.set(LOCALE_COOKIE, localeCookieToSet);
  }

  // 4. Run next-intl middleware (sets the locale + locale cookie)
  const intlResponse = intlMiddleware(request);

  // 4b. Persist the resolved locale cookie on the response too.
  if (localeCookieToSet) {
    intlResponse.cookies.set(LOCALE_COOKIE, localeCookieToSet, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // 5. Merge Supabase session cookies onto the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  // 5b. Persist the "MFA enrolled" hint so subsequent navigations skip the
  // listFactors() network call. Session cookie (no maxAge) so it clears on
  // browser/session end alongside the auth cookies.
  if (setMfaEnrolledCookie) {
    intlResponse.cookies.set("2fa_enrolled", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return intlResponse;
}

export const config = {
  // Match every page request except Next.js internals, static files,
  // and API routes. Excluding all of `/api` is critical: the next-intl
  // middleware run at the bottom of this file doesn't know about API
  // routes and treats them as unmatched localised pages → returns 404.
  // That broke `/api/copilot/sessions` (and would have broken every
  // other authenticated API route the moment a client called it from
  // the browser).
  //
  // Auth gates only apply to pages (`/app/*`, `/auth/*`), and route
  // handlers run their own auth check via `supabase.auth.getUser()`,
  // so excluding `/api` doesn't loosen any access control. Session
  // cookies the browser holds are still sent on API requests; the
  // middleware's role on /api was just session refresh which the
  // route handlers don't depend on (they validate the session
  // independently each call).
  matcher: [
    "/((?!_next/static|_next/image|favicon|api|monitoring|.*\\..*).*)",
  ],
};
