import { GsapProvider } from "@/components/gsap-provider";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "./_components/landing-header";
import { LandingFooter } from "./_components/landing-footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth state server-side so the header can swap 'Log in' → 'Dashboard'
  // for already-signed-in visitors. Cheap (single getUser call) and avoids
  // a client-side flash of the wrong CTA.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader isAuthed={!!user} />
      <main className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
