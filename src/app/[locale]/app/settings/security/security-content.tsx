"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeIcon } from "@/components/huge-icon";
import { useToast } from "@/components/ui/toast";

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
}: {
  hasTotp: boolean;
  factorId: string | null;
  friendlyName: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<EnrolState>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  async function startEnrolment() {
    const supabase = createClient();
    // friendly_name is what shows up in the Supabase dashboard factor list;
    // the device name is what shows up inside authenticator apps.
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Seentrix ${new Date().toLocaleDateString()}`,
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
      toast({ type: "success", message: "2FA removed" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Current state */}
      <div className="rounded-xl bg-card">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold">Two-factor authentication</h2>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Adds a second step on sign-in — a 6-digit code from an
            authenticator app on your phone. Strongly recommended, required
            for admins of organisations on a paid plan.
          </p>
        </div>

        <div className="px-6 py-5">
          {hasTotp ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#16A34A]/20 text-[#16A34A]">
                  <HugeIcon
                    name="checkmark-circle-01-stroke-rounded"
                    size={16}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    2FA is enabled
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                2FA is not yet set up on this account.
              </p>
              <Button onClick={startEnrolment} size="sm" className="mt-3">
                Enable 2FA
              </Button>
            </div>
          ) : (
            <EnrolStep
              state={state}
              code={code}
              setCode={setCode}
              onVerify={verifyCode}
              onCancel={() => {
                setState({ kind: "idle" });
                setCode("");
              }}
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
        <p className="text-sm font-semibold text-foreground">
          1. Scan the QR code
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open your authenticator app (1Password, Authy, Google Authenticator,
          etc.) and scan this QR code, or paste the secret manually.
        </p>
        <div
          className="mt-4 inline-block rounded-xl bg-white p-3"
          dangerouslySetInnerHTML={{ __html: state.qrSvg }}
        />
        <p className="mt-3 text-[11px] text-muted-foreground">
          Manual secret:{" "}
          <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono">
            {state.secret}
          </code>
        </p>
      </div>

      <div>
        <Label htmlFor="mfa-code" className="text-sm font-semibold">
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
