import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Detect locale from Accept-Language header, fallback to "en"
  const acceptLang = request.headers.get("accept-language") ?? "";
  const locale = acceptLang.toLowerCase().startsWith("de") ? "de" : "en";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL(`/${locale}/auth/reset-password`, request.url)
        );
      }

      // Check if user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.app_metadata?.org_id) {
        return NextResponse.redirect(
          new URL(`/${locale}/app/dashboard`, request.url)
        );
      }

      return NextResponse.redirect(
        new URL(`/${locale}/auth/onboarding`, request.url)
      );
    }
  }

  // Code exchange failed or no code — redirect to login
  return NextResponse.redirect(
    new URL(`/${locale}/auth/login`, request.url)
  );
}
