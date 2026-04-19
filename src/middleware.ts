import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createClient } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Create Supabase client & refresh session
  const { supabase, response: supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 2. Extract locale and determine route type
  const localeMatch = pathname.match(/^\/(en|de)(\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;

  const isAuthRoute = pathname.startsWith(`/${locale}/auth`);
  const isAppRoute = pathname.startsWith(`/${locale}/app`);
  const isOnboardingRoute = pathname.startsWith(`/${locale}/auth/onboarding`);
  const isChangePasswordRoute = pathname.startsWith(
    `/${locale}/auth/change-password`
  );
  const isMfaChallengeRoute = pathname.startsWith(`/${locale}/auth/mfa`);
  const isLoginOrSignup =
    pathname.startsWith(`/${locale}/auth/login`) ||
    pathname.startsWith(`/${locale}/auth/signup`);

  // Academy routes are exempt from the training gate so users can actually
  // reach the lessons that unlock it. We also exempt the top-level account
  // + logout flows so people can still sign out without completing training.
  const isAcademyRoute = pathname.startsWith(`/${locale}/app/academy`);

  const orgId = user?.app_metadata?.org_id;
  const mustChangePassword = user?.app_metadata?.must_change_password === true;
  const mustCompleteTraining =
    user?.app_metadata?.must_complete_training === true;

  // AAL gating — when a user has MFA enrolled, Supabase issues a session
  // at AAL1 (password only) after signInWithPassword. The middleware then
  // bounces them to /auth/mfa until they elevate to AAL2 (password + TOTP).
  // This check uses the MFA API which is cheap (no DB round-trip; works
  // off the JWT claims).
  let needsMfaChallenge = false;
  if (user && orgId) {
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsMfaChallenge =
      aalData?.nextLevel === "aal2" && aalData.currentLevel === "aal1";
  }

  // 3. Redirect rules

  // Unauthed trying to access app routes → login
  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  // Unauthed trying to access onboarding → login
  if (!user && isOnboardingRoute) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  // Unauthed trying to access change-password → login
  if (!user && isChangePasswordRoute) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  // Authed with must_change_password trying to access app routes → change password
  if (user && orgId && mustChangePassword && isAppRoute) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/change-password`, request.url)
    );
  }

  // MFA challenge — any authed user with a pending AAL2 requirement gets
  // bounced to the TOTP challenge before reaching app or settings. Also
  // applies to the login page so a freshly-logged-in user can't linger on
  // /auth/login after the MFA API has already noticed they need to
  // elevate.
  if (
    user &&
    orgId &&
    needsMfaChallenge &&
    !isMfaChallengeRoute &&
    (isAppRoute || isLoginOrSignup)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/mfa`, request.url),
    );
  }

  // Authed + already passed MFA but sitting on the challenge page → go
  // to the dashboard so we don't strand them there.
  if (user && orgId && !needsMfaChallenge && isMfaChallengeRoute) {
    return NextResponse.redirect(
      new URL(`/${locale}/app/dashboard`, request.url),
    );
  }

  // Authed with must_change_password trying to access login/signup → change password
  if (user && orgId && mustChangePassword && isLoginOrSignup) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/change-password`, request.url)
    );
  }

  // Authed without org trying to access app routes → onboarding
  if (user && !orgId && isAppRoute) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/onboarding`, request.url)
    );
  }

  // Authed with org (no password change needed) trying to access login/signup → dashboard
  if (user && orgId && !mustChangePassword && isLoginOrSignup) {
    return NextResponse.redirect(
      new URL(`/${locale}/app/dashboard`, request.url)
    );
  }

  // Authed with org trying to access onboarding → dashboard
  if (user && orgId && isOnboardingRoute) {
    return NextResponse.redirect(
      new URL(`/${locale}/app/dashboard`, request.url)
    );
  }

  // Authed with org but training not complete trying to access an app route
  // that isn't the Academy itself → redirect to Academy. The must_change_
  // password check above takes priority because a user with a pending
  // password change shouldn't even see the Academy yet.
  if (
    user &&
    orgId &&
    !mustChangePassword &&
    mustCompleteTraining &&
    isAppRoute &&
    !isAcademyRoute
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/app/academy`, request.url)
    );
  }

  // 4. Run intl middleware for locale handling
  const intlResponse = intlMiddleware(request);

  // 5. Merge Supabase session cookies onto the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(en|de)/:path*"],
};
