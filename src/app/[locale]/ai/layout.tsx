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
      <LandingHeader isAuthed={!!user} />
      <main id="main" className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
