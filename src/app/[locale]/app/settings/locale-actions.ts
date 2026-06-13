"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/locales";
import { isDocLocale } from "@/lib/pdf/doc-locales";
import { DOC_LOCALE_COOKIE } from "@/lib/pdf/doc-locale-cookie";

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

/**
 * Persist the user's default DOCUMENT language — the language generated CRA
 * documents (DoC, Annex II) come out in. Distinct from the UI language above:
 * it supports the eight market languages and does NOT change the interface, so
 * no re-render is needed. Mirrored into NEXT_DOC_LOCALE for the on-demand PDF
 * routes + written to the user row as the cross-device source of truth.
 */
export async function setPreferredDocLanguage(
  locale: string,
): Promise<{ ok: boolean }> {
  if (!isDocLocale(locale)) return { ok: false };

  const cookieStore = await cookies();
  cookieStore.set(DOC_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const supabase = await createClient();
  const user = await getAuthUser();
  if (user) {
    await supabase
      .from("users")
      .update({ preferred_doc_language: locale })
      .eq("id", user.id);
  }
  return { ok: true };
}
