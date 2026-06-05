import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConfirmedView } from "./confirmed-view";

/**
 * Post-email-confirmation acknowledgement.
 *
 * Reached from /auth/callback after a fresh signup's confirmation link is
 * exchanged for a session. Guards:
 *   - no session  → /auth/login (the link expired or was already used)
 *   - has an org  → /app/dashboard (already onboarded; nothing to confirm)
 *   - otherwise   → show the "email confirmed" screen with a CTA into
 *                   account setup (/auth/onboarding).
 */
export default async function ConfirmedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.app_metadata?.org_id) {
    redirect("/app/dashboard");
  }

  return <ConfirmedView />;
}

export const metadata = {
  title: "Email confirmed",
  robots: { index: false, follow: false },
};
