import { MfaChallenge } from "./mfa-challenge";

/**
 * Post-login MFA challenge page. Middleware bounces any user with
 * currentLevel=aal1 + nextLevel=aal2 here until they verify their TOTP.
 *
 * Renders directly inside AuthLayout's white card — no extra wrapper.
 */
export default function MfaPage() {
  return <MfaChallenge />;
}

export const metadata = { title: "Two-factor verification" };
