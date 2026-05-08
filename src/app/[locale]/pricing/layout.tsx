import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "../(marketing)/_components/landing-header";
import { LandingFooter } from "../(marketing)/_components/landing-footer";
import { GsapProvider } from "@/components/gsap-provider";

/**
 * /pricing reuses the same marketing chrome as / so anonymous visitors
 * always see the same Log in / Get started CTAs and have the same
 * footer (legal, address, sitemap). Previously the page had its own
 * stripped-down header that linked only to /app/dashboard — a dead-end
 * for unauthed visitors, and no footer at all.
 */
export default async function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader isAuthed={!!user} />
      <main id="main" className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
