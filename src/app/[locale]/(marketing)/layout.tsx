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
      {/* Skip-to-main-content. Visible only when keyboard-focused —
          lets a screen-reader / keyboard user bypass the sticky header
          + 11 marketing sections on every page navigation. */}
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
