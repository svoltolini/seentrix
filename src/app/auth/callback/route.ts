import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Redirects are built off `SITE_URL` (the env-fixed canonical origin)
 * rather than `request.url`, which reflects the inbound `Host` header.
 * Vercel normalises Host on Vercel-managed projects, but elsewhere a
 * spoofed `Host: evil.com` could mint a redirect to a phishing origin
 * with a freshly-exchanged session cookie scoped to the legit domain.
 * SITE_URL is defence-in-depth.
 */
function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, SITE_URL));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "recovery") {
        return redirectTo("/auth/reset-password");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.app_metadata?.org_id) {
        return redirectTo("/app/dashboard");
      }

      // Freshly-confirmed signups (no org yet) get an explicit
      // "email confirmed" acknowledgement before the account-setup form,
      // rather than being dropped straight into onboarding.
      if (type === "signup") {
        return redirectTo("/auth/confirmed");
      }

      return redirectTo("/auth/onboarding");
    }
  }

  return redirectTo("/auth/login");
}
