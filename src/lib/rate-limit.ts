import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sliding-window rate limiter backed by public.rate_limits.
 *
 * Strategy: one row per (key, window_start). On each call we
 *   - compute the current window start by bucketing now into `windowMs`
 *     intervals,
 *   - upsert-increment that row's `hits`,
 *   - compare against `limit`.
 *
 * Not as precise as a Redis sliding-window counter, but good enough for
 * anti-spam on public endpoints (PSIRT intake, newsletter, security-txt).
 * No extra infra required — we already have Supabase.
 */
export async function rateLimit({
  endpoint,
  identifier,
  limit,
  windowMs,
}: {
  /** Logical endpoint name, e.g. "psirt", "newsletter". Becomes part of the key so buckets don't collide across features. */
  endpoint: string;
  /** Caller fingerprint. For unauthed public endpoints use the forwarded-for IP. */
  identifier: string;
  /** Max requests allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}): Promise<{ ok: boolean; retryAfterSeconds?: number }> {
  const supabase = createAdminClient();

  // Bucket `now` into `windowMs` intervals. Two callers in the same bucket
  // share the same row; the first caller after the boundary starts fresh.
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const key = `${endpoint}:${identifier}`;

  // Atomic check-and-increment. Postgres upsert with `hits = hits + 1`
  // gets us to-the-byte precision on the counter even under concurrency.
  const { data, error } = await supabase.rpc("increment_rate_limit_hits", {
    p_key: key,
    p_window_start: windowStart.toISOString(),
  });
  if (error) {
    // Fail open — a rate-limit outage shouldn't take the app down.
    // Errors are tracked through Sentry (when configured).
    console.error("rate_limit_error", { key, error });
    return { ok: true };
  }

  const hits = (data as number | null) ?? 1;
  if (hits > limit) {
    const retryAfterMs = windowStart.getTime() + windowMs - now;
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }
  return { ok: true };
}

/**
 * Best-effort client-IP extraction. Vercel sets `x-forwarded-for` with the
 * real IP first; `x-real-ip` is a fallback for non-Vercel environments.
 * Anonymous requests without any of these get bucketed together under
 * "unknown" — worst case everyone shares one limit, which is safer than
 * no limit.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
