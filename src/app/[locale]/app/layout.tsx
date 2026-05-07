import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ToastProvider } from "@/components/ui/toast";
import { GsapProvider } from "@/components/gsap-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import { CopilotProvider } from "@/components/copilot/copilot-provider";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let displayName: string | null = null;
  let orgName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("avatar_url, full_name, organization:organizations(name)")
      .eq("id", user.id)
      .single<{
        avatar_url: string | null;
        full_name: string | null;
        organization: { name: string | null } | null;
      }>();
    avatarUrl = data?.avatar_url ?? null;
    displayName = data?.full_name ?? null;
    orgName = data?.organization?.name ?? null;
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
        </CopilotProvider>
      </GsapProvider>
    </ToastProvider>
  );
}
