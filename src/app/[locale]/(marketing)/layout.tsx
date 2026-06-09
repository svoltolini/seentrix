import type { User } from "@supabase/supabase-js";
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
  //
  // This is purely cosmetic, so it must never crash the public marketing
  // shell. A missing-env situation on an old/preview deployment, or a
  // transient Supabase auth hiccup, would otherwise throw out of this layout
  // and 500 every marketing page — including asset-ish paths like
  // /favicon.png that fall through to the [locale] segment. Degrade to
  // logged-out instead of throwing.
  let user: User | null = null;
  try {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

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
