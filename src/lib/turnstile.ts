/**
 * Cloudflare Turnstile verification.
 *
 * The widget on the client posts a one-shot token alongside form data.
 * This helper exchanges that token for a `success: true` from the
 * Turnstile siteverify endpoint, scoped by the caller's IP.
 *
 * Tokens are single-use (the response includes them in the audit log)
 * and expire after ~5 minutes — Cloudflare enforces this server-side
 * so we don't need to track validity locally.
 *
 * Behaviour when not configured:
 *   - If `TURNSTILE_SECRET_KEY` isn't set, this returns `ok: true` so
 *     dev environments without a Cloudflare account aren't blocked.
 *     Production must set the env var or every protected form bypasses
 *     the check — the boot would log a warning if we wanted to make
 *     that loud, but we'd rather not gate prod startup on a soft
 *     dependency.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  ok: boolean;
  /** Cloudflare's `error-codes`. Useful for distinguishing 'token-already-used' vs 'invalid-input-response' in logs. */
  errorCodes?: string[];
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Dev no-op — see module comment.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY is not set in production — verification is bypassed",
      );
    }
    return { ok: true };
  }

  if (!token) return { ok: false, errorCodes: ["missing-input-response"] };

  // FormData rather than JSON — the siteverify endpoint requires form-encoded.
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Cloudflare is fast (~100 ms p95) but cap it so a hung edge node
      // doesn't stall the form submission for the user. Failing closed
      // here rather than at the rate-limit layer because Turnstile is
      // the user-facing speed bump — better to retry once than mistakenly
      // accept the submission.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn("[turnstile] siteverify HTTP", res.status);
      return { ok: false, errorCodes: ["siteverify-http-error"] };
    }
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return data.success
      ? { ok: true }
      : { ok: false, errorCodes: data["error-codes"] };
  } catch (err) {
    console.warn("[turnstile] siteverify network error", err);
    return { ok: false, errorCodes: ["siteverify-network-error"] };
  }
}
