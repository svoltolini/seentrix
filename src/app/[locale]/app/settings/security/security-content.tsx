"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { useToast } from "@/components/ui/toast";
import {
  snoozeMfaEnrolment,
  clearMfaGrace,
  clearUnverifiedMfaFactors,
  clearMfaEnrolledCookie,
} from "./actions";

type EnrolState =
  | { kind: "idle" }
  | {
      kind: "enrolling";
      factorId: string;
      qrSvg: string;
      secret: string;
    }
  | { kind: "done" };

/**
 * MFA enrolment + un-enrolment UI. Uses Supabase's MFA factor API
 * (enroll → challenge → verify) directly from the browser so the secret
 * never crosses the network to our own servers.
 */
export function SecurityContent({
  hasTotp,
  factorId,
  friendlyName,
  enrollRequired = false,
}: {
  hasTotp: boolean;
  factorId: string | null;
  friendlyName: string | null;
  enrollRequired?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<EnrolState>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [snoozePending, startSnoozeTransition] = useTransition();

  // "Remind me later" — set the session grace cookie via a server action so
  // the middleware stops redirecting here, then head to the dashboard.
  function remindLater() {
    startSnoozeTransition(async () => {
      await snoozeMfaEnrolment();
      router.push("/app/dashboard");
      router.refresh();
    });
  }

  async function startEnrolment() {
    // Clean up any *unverified* TOTP factors left over from a previous attempt
    // the user abandoned (Cancel, navigated away, failed verify). Supabase
    // keeps the half-enrolled factor around and a second enroll then fails with
    // "a factor with the friendly name ... already exists" (including the empty
    // name). We do this server-side with the service-role admin client because
    // the client-side unenroll can require AAL2 and races the enroll call.
    startTransition(async () => {
      await clearUnverifiedMfaFactors();

      const supabase = createClient();
      // Use a unique friendly name so two factors can never collide on the
      // name even if a stale one somehow slips through the cleanup above.
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Seentrix · ${Date.now()}`,
      });
      if (error || !data) {
        toast({
          type: "error",
          message: error?.message ?? "Failed to start enrolment",
        });
        return;
      }
      setState({
        kind: "enrolling",
        factorId: data.id,
        qrSvg: data.totp.qr_code,
        secret: data.totp.secret,
      });
    });
  }

  // Cancelling a half-finished enrolment must remove the unverified factor it
  // created, otherwise the next "Enable 2FA" collides / leaves an orphan. Use
  // the same robust server-side cleanup.
  function cancelEnrolment() {
    setState({ kind: "idle" });
    setCode("");
    void clearUnverifiedMfaFactors();
  }

  async function verifyCode() {
    if (state.kind !== "enrolling") return;
    startTransition(async () => {
      const supabase = createClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: state.factorId });
      if (challengeError || !challenge) {
        toast({
          type: "error",
          message: challengeError?.message ?? "Challenge failed",
        });
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) {
        toast({
          type: "error",
          message: verifyError.message ?? "Invalid code",
        });
        return;
      }
      toast({ type: "success", message: "2FA enabled" });
      setState({ kind: "done" });
      setCode("");
      // 2FA is now satisfied — drop the grace cookie so nothing lingers.
      await clearMfaGrace();
      router.refresh();
    });
  }

  async function removeFactor() {
    if (!factorId) return;
    if (!confirm("Remove 2FA from this account? You'll still be able to log in with your password only.")) {
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast({ type: "error", message: error.message });
        return;
      }
      // Clear the cached enrolment hint so the middleware re-checks (and the
      // mandatory-2FA gate re-engages) on the next navigation.
      await clearMfaEnrolledCookie();
      toast({ type: "success", message: "2FA removed" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Mandatory-enrolment gate banner — shown when the middleware bounced an
          un-enrolled user here. Explains 2FA is required and offers a
          "Remind me later" escape hatch (session-scoped grace). */}
      {enrollRequired && !hasTotp && (
        <div className="rounded-md border-[1.5px] border-warning/40 bg-warning/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning">
              <Icon name="alert-02" size={18} variant="Bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-h6 text-foreground">
                Two-factor authentication is required
              </p>
              <p className="mt-1 text-p3 text-muted-foreground">
                Seentrix protects CRA compliance records, so every account must
                use 2FA. Set it up now — it takes about a minute with any
                authenticator app. You can postpone once, but you&apos;ll be
                reminded each time you sign in until it&apos;s enabled.
              </p>
            </div>
          </div>
          {/* Full-width text above; the postpone action sits below it. */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={remindLater}
              disabled={snoozePending}
            >
              {snoozePending ? "Saving…" : "Remind me later"}
            </Button>
          </div>
        </div>
      )}

      {/* Current state */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-h4 text-foreground">Two-factor authentication</h2>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            Adds a second step on sign-in — a 6-digit code from an
            authenticator app on your phone. Required for every Seentrix
            account.
          </p>
        </div>

        <div className="px-6 py-5">
          {hasTotp ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <IconBadge
                  name="checkmark-circle-01-stroke-rounded"
                  tone="success"
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-h5 text-foreground">2FA is enabled</p>
                  <p className="mt-1 text-p3-r text-muted-foreground">
                    {friendlyName ?? "TOTP authenticator"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={removeFactor}
                disabled={isPending}
              >
                Disable
              </Button>
            </div>
          ) : state.kind === "idle" || state.kind === "done" ? (
            <div>
              <p className="text-p3 text-muted-foreground">
                2FA is not yet set up on this account.
              </p>
              <Button
                onClick={startEnrolment}
                size="sm"
                className="mt-3"
                disabled={isPending}
              >
                {isPending ? "Starting…" : "Enable 2FA"}
              </Button>
            </div>
          ) : (
            <EnrolStep
              state={state}
              code={code}
              setCode={setCode}
              onVerify={verifyCode}
              onCancel={cancelEnrolment}
              isPending={isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EnrolStep({
  state,
  code,
  setCode,
  onVerify,
  onCancel,
  isPending,
}: {
  state: Extract<EnrolState, { kind: "enrolling" }>;
  code: string;
  setCode: (v: string) => void;
  onVerify: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-l5 text-foreground">
          1. Scan the QR code
        </p>
        <p className="mt-1 text-p3 text-muted-foreground">
          Open your authenticator app (1Password, Authy, Google Authenticator,
          etc.) and scan this QR code to add Seentrix.
        </p>
        {/* Supabase returns `totp.qr_code` as a data-URI
            (`data:image/svg+xml;utf-8,<svg…>`), so render it as an <img> src.
            The previous `dangerouslySetInnerHTML` approach dumped the data-URI
            prefix as visible text above the code. */}
        <div className="mt-4 inline-block rounded-md bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.qrSvg}
            alt="Two-factor authentication QR code"
            className="size-44"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="mfa-code" size="lg">
          2. Enter the 6-digit code
        </Label>
        <Input
          id="mfa-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          maxLength={6}
          placeholder="000000"
          className="mt-2 max-w-[160px] font-mono text-center tracking-[0.4em]"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onVerify}
          disabled={code.length !== 6 || isPending}
        >
          {isPending ? "Verifying…" : "Confirm + enable"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
