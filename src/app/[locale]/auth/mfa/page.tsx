import { MfaChallenge } from "./mfa-challenge";

/**
 * Post-login MFA challenge page. Middleware bounces any user with
 * currentLevel=aal1 + nextLevel=aal2 here until they verify their TOTP.
 */
export default function MfaPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <MfaChallenge />
    </div>
  );
}

export const metadata = { title: "Two-factor verification" };
