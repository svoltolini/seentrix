import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Request-scoped, de-duplicated current user.
 *
 * `supabase.auth.getUser()` makes a network round-trip to the Supabase Auth
 * server to validate the token. Several server components in a single render
 * (layout, page, nested widgets) each used to call it independently, paying
 * that round-trip multiple times per navigation. Wrapping it in React
 * `cache()` collapses all calls within one render pass to a single network
 * call, which directly speeds up every page load. Cache is per-request, so
 * there's no cross-request staleness risk.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
