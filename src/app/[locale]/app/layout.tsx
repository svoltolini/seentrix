import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ToastProvider } from "@/components/ui/toast";
import { GsapProvider } from "@/components/gsap-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import { CopilotProvider } from "@/components/copilot/copilot-provider";
import { CreateProductSheet } from "@/components/products/create-product-sheet";
import { createClient } from "@/lib/supabase/server";

/**
 * Pull a usable display name out of whatever sources we have. The
 * `public.users.full_name` column is the canonical source — populated
 * during onboarding via the `create_org_and_user` RPC. But:
 *   - Some users predate the onboarding flow, so the column can be null.
 *   - Members invited by an admin also start with a null full_name
 *     until they update their profile.
 * Without a fallback the topbar dropdown header read literally "User"
 * for those accounts. The chain below reaches into the auth
 * user_metadata (set during signup) and ultimately the email local-part
 * so we always render something meaningful.
 */
function resolveDisplayName(opts: {
  fromUsersTable: string | null;
  fromAuthMetadata: string | null;
  email: string | null;
}): string | null {
  if (opts.fromUsersTable?.trim()) return opts.fromUsersTable.trim();
  if (opts.fromAuthMetadata?.trim()) return opts.fromAuthMetadata.trim();
  if (opts.email) {
    // "samuel.voltolini@example.com" → "Samuel Voltolini"
    const local = opts.email.split("@")[0];
    if (!local) return null;
    return local
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return null;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let displayName: string | null = null;
  let orgName: string | null = null;
  if (user) {
    // Two separate queries instead of one nested join. The earlier
    // `.select("avatar_url, full_name, organization:organizations(name)")`
    // returned `avatar_url: null` even when the column held a valid URL
    // — PostgREST's join semantics combined with RLS on both tables
    // were silently dropping the parent column for some accounts. The
    // Activity feed and Settings → Account both read avatar_url with a
    // plain non-joined select and have always worked. Mirror that
    // pattern here. Issued in parallel via Promise.all so the layout
    // doesn't pay two serial round-trips.
    const orgId = user.app_metadata?.org_id as string | undefined;
    const [userRowRes, orgRowRes] = await Promise.all([
      supabase
        .from("users")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single<{ avatar_url: string | null; full_name: string | null }>(),
      orgId
        ? supabase
            .from("organizations")
            .select("name")
            .eq("id", orgId)
            .single<{ name: string | null }>()
        : Promise.resolve({ data: null }),
    ]);

    avatarUrl =
      userRowRes.data?.avatar_url ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      null;
    displayName = resolveDisplayName({
      fromUsersTable: userRowRes.data?.full_name ?? null,
      fromAuthMetadata:
        (user.user_metadata?.full_name as string | undefined) ?? null,
      email: user.email ?? null,
    });
    orgName = orgRowRes.data?.name ?? null;
  }

  const userProfile = {
    name: displayName,
    email: user?.email ?? null,
    avatarUrl,
  };

  return (
    <ToastProvider>
      <GsapProvider>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <CopilotProvider>
          {/* Global "+ New Product" side sheet. It now PROVIDES the
              create-product context and wraps the shell, so any affordance
              (topbar, dashboard, empty states) can call
              `useCreateProduct().open()` to reveal the sheet instantly via
              React state — no route navigation jank. The `?new=product`
              query param is still honoured for deep-links. */}
          <Suspense fallback={null}>
            <CreateProductSheet>
              {/* Nask shell: 310px sidebar + flex-1 main column with slim topbar. */}
              <div className="flex h-screen overflow-hidden">
                <AppSidebar user={userProfile} orgName={orgName} />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <AppTopbar user={userProfile} orgName={orgName} />
                  <main className="flex-1 overflow-y-auto bg-background px-4 py-6 lg:px-8 lg:py-8">
                    {children}
                  </main>
                </div>
              </div>
            </CreateProductSheet>
          </Suspense>
        </CopilotProvider>
      </GsapProvider>
    </ToastProvider>
  );
}
