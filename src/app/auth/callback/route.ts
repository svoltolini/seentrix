import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL("/auth/reset-password", request.url)
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.app_metadata?.org_id) {
        return NextResponse.redirect(
          new URL("/app/dashboard", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/auth/onboarding", request.url)
      );
    }
  }

  return NextResponse.redirect(new URL("/auth/login", request.url));
}
