"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeIcon } from "@/components/huge-icon";

/**
 * TOTP challenge screen shown after a password-only login when the user
 * has 2FA enrolled. Succeeds → Supabase issues an AAL2 token and the
 * middleware lets them into /app. Fails → they stay here with an error.
 */
export function MfaChallenge() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find(
        (f) => f.status === "verified",
      );
      if (!verified) {
        // No factor enrolled — shouldn't happen because middleware gates
        // on nextLevel=aal2. If we land here anyway, bounce back to
        // login which will reset.
        router.replace("/auth/login");
        return;
      }
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: verified.id,
      });
      if (cancelled) return;
      if (chErr || !ch) {
        setError(chErr?.message ?? "Couldn't start the challenge");
        return;
      }
      setFactorId(verified.id);
      setChallengeId(ch.id);
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function verify() {
    if (!factorId || !challengeId) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim(),
      });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid code");
        return;
      }
      router.replace("/app/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] p-8">
      <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <HugeIcon name="lock-password-stroke-rounded" size={18} />
      </div>
      <h1 className="font-heading text-xl font-bold text-foreground">
        Two-factor code
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Open your authenticator app and enter the current 6-digit code
        for Seentrix.
      </p>

      <div className="mt-6">
        <Label htmlFor="mfa-code" className="text-sm">
          Code
        </Label>
        <Input
          id="mfa-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          className="mt-2 font-mono text-center text-lg tracking-[0.4em]"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={verify}
        disabled={code.length !== 6 || isPending || !challengeId}
        className="mt-5 w-full"
      >
        {isPending ? "Verifying…" : "Verify"}
      </Button>
    </div>
  );
}
