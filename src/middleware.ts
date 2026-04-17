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
  const isLoginOrSignup =
    pathname.startsWith(`/${locale}/auth/login`) ||
    pathname.startsWith(`/${locale}/auth/signup`);

  const orgId = user?.app_metadata?.org_id;
  const mustChangePassword = user?.app_metadata?.must_change_password === true;

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
