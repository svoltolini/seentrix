import { TopBar } from "@/components/layout/top-bar";
import { ToastProvider } from "@/components/ui/toast";
import { GsapProvider } from "@/components/gsap-provider";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = (data as { avatar_url: string | null } | null)?.avatar_url ?? null;
  }

  return (
    <ToastProvider>
      <GsapProvider>
        <div className="flex h-full flex-col">
          <TopBar avatarUrl={avatarUrl} />
          <main className="flex-1 overflow-y-auto bg-background px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </GsapProvider>
    </ToastProvider>
  );
}
