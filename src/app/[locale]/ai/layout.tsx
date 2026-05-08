import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "../(marketing)/_components/landing-header";
import { LandingFooter } from "../(marketing)/_components/landing-footer";
import { GsapProvider } from "@/components/gsap-provider";

/**
 * /ai (the Copilot landing page) shares the marketing chrome — same
 * header CTAs, same footer. Earlier this page rendered its own
 * minimal header which left the visitor with no Log in or Back-to-
 * landing affordance.
 */
export default async function AiLayout({
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-l6 focus:text-primary-foreground focus:shadow-card-md focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        Skip to main content
      </a>
      <LandingHeader isAuthed={!!user} />
      <main id="main" className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
