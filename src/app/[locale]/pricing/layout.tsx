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
