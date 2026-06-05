import { createClient } from "@/lib/supabase/server";
import { SecurityContent } from "./security-content";

/**
 * Settings → Security — MFA enrollment and factor management.
 *
 * Loads the current user's enrolled factors server-side so the client UI
 * renders the right state (enrolled ⇒ show "Disable"; not enrolled ⇒ show
 * "Enable 2FA"). Actual enrolment / verification happens client-side
 * because the QR secret is returned only to the caller and must never
 * leave the browser.
 */
export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ enroll?: string }>;
}) {
  const supabase = await createClient();
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = (factorsData?.totp ?? []).find(
    (f) => f.status === "verified",
  );

  // The middleware appends `?enroll=1` when it redirects an un-enrolled user
  // here. We surface a prominent "2FA is required" gate + a "Remind me later"
  // affordance in that case.
  const { enroll } = await searchParams;
  const enrollRequired = enroll === "1" && !verifiedTotp;

  return (
    <SecurityContent
      hasTotp={Boolean(verifiedTotp)}
      factorId={verifiedTotp?.id ?? null}
      friendlyName={verifiedTotp?.friendly_name ?? null}
      enrollRequired={enrollRequired}
    />
  );
}

export const metadata = { title: "Security" };
