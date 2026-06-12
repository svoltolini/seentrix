"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/locales";

/**
 * Persist the user's chosen UI language.
 *
 * Writes `preferred_locale` on the caller's own `public.users` row (the source
 * of truth) and mirrors it into the `NEXT_LOCALE` cookie so next-intl picks it
 * up immediately on the next render — no URL prefix, no reload needed beyond
 * the router refresh the client triggers. The cookie is long-lived so an
 * unauthenticated visit (e.g. the marketing site) still respects the choice.
 */
export async function setPreferredLocale(
  locale: string,
): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };

  // Mirror into the cookie first — this is what actually changes the rendered
  // language, and it must work even for a not-yet-authenticated visitor.
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Persist on the user row when authenticated (source of truth across
  // devices). Scoped to the caller's own id.
  const supabase = await createClient();
  const user = await getAuthUser();
  if (user) {
    await supabase
      .from("users")
      .update({ preferred_locale: locale as Locale })
      .eq("id", user.id);
  }

  // Re-render everything in the new language.
  revalidatePath("/", "layout");
  return { ok: true };
}
