"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "../actions";

/**
 * TOTP challenge screen shown after a password-only login when the user
 * has 2FA enrolled. Succeeds → Supabase issues an AAL2 token and the
 * middleware lets them into /app. Fails → they stay here with an error.
 *
 * UX shape:
 *  - 6 segmented digit boxes, one per character of the TOTP code.
 *  - Auto-advance on digit entry, auto-retreat on backspace of empty box,
 *    arrow keys to navigate, paste-to-fill support.
 *  - Submit button stays disabled until all 6 digits are entered.
 *  - Escape hatch below the button for a user who lost their authenticator
 *    (wiped phone, etc.) — signs them out so support can help reset.
 */
export function MfaChallenge() {
  const router = useRouter();
  const locale = useLocale();
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancel] = useTransition();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const isComplete = code.length === 6;

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find(
        (f) => f.status === "verified",
      );
      if (!verified) {
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

  // Focus the first box on mount so the user can start typing immediately.
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const setDigitAt = useCallback((index: number, value: string) => {
    // Only keep the last entered digit in case the input event delivered
    // more than one character (e.g. browser autofill of multiple digits).
    const sanitised = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = sanitised;
      return next;
    });
    setError(null);
    if (sanitised && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!digits[index] && index > 0) {
          e.preventDefault();
          setDigits((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isComplete) verify();
      }
    },
    // `verify` is stable within the render scope; intentionally omitting
    // to avoid re-creating handlers on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits, isComplete],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      if (!pasted) return;
      const next = Array(6).fill("");
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);
      setError(null);
      // Focus the next empty box, or the last if fully filled.
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    },
    [],
  );

  function verify() {
    if (!factorId || !challengeId || !isComplete) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid code");
        // Clear the inputs + refocus the first box so they can retry.
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
      router.replace("/app/dashboard");
      router.refresh();
    });
  }

  const inputsDisabled = isPending || !challengeId;

  return (
    <div className="rounded-md bg-muted p-8">
      <p className="text-l6-plus uppercase tracking-[2.5px] text-primary">
        Verify
      </p>
      <h1 className="mt-2 text-h2 text-foreground">
        Two-factor code
      </h1>
      <p className="mt-2 text-p3 leading-relaxed text-muted-foreground">
        Open your authenticator app and enter the current 6-digit code for
        Seentrix.
      </p>

      {/* Code boxes */}
      <div
        className="mt-7 flex items-center justify-between gap-2"
        role="group"
        aria-label="Two-factor authentication code"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => setDigitAt(index, e.target.value)}
            onKeyDown={handleKeyDown(index)}
            onPaste={index === 0 ? handlePaste : undefined}
            onFocus={(e) => e.currentTarget.select()}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={inputsDisabled}
            aria-label={`Digit ${index + 1}`}
            className={cn(
              "aspect-square w-full max-w-[52px] rounded-md bg-input text-center font-mono text-h3 text-foreground transition-all",
              "border-[1.5px] border-transparent",
              "focus:border-primary/30 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:opacity-50",
              error && "border-destructive/60",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-p4 text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={verify}
        disabled={!isComplete || isPending || !challengeId}
        className="mt-6 w-full"
      >
        {isPending ? "Verifying…" : "Verify"}
      </Button>

      {/* Escape hatch — wiped phone / lost factor → sign out so they can
          re-authenticate via password + raise support. Subtle styling so
          it reads as a last resort, not the primary action. */}
      <button
        type="button"
        onClick={() => startCancel(() => logout(locale))}
        disabled={isCancelling || isPending}
        className="mt-5 block w-full text-center text-p4 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {isCancelling
          ? "Signing out…"
          : "Lost your authenticator? Sign out"}
      </button>
    </div>
  );
}
