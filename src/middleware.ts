import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
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

  const orgId = user?.app_metadata?.org_id;
  const mustChangePassword = user?.app_metadata?.must_change_password === true;
  const mustCompleteTraining =
    user?.app_metadata?.must_complete_training === true;

  // AAL gating — when a user has MFA enrolled, Supabase issues a session
  // at AAL1 (password only) after signInWithPassword. Bounce them to
  // /auth/mfa until they elevate to AAL2 (password + TOTP). The MFA API
  // is cheap (no DB round-trip — works off the JWT claims).
  let needsMfaChallenge = false;
  if (user && orgId) {
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsMfaChallenge =
      aalData?.nextLevel === "aal2" && aalData.currentLevel === "aal1";
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

  // 4. Run next-intl middleware (sets the locale + locale cookie)
  const intlResponse = intlMiddleware(request);

  // 5. Merge Supabase session cookies onto the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

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
