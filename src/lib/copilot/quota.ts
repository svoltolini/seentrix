import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-plan monthly message quota and per-user burst limit for the Copilot.
 *
 * Two enforcement layers:
 *
 *   A) Sliding-window monthly quota, stored in Upstash Redis (EU region).
 *      The plan's ceiling is read from PLAN_MONTHLY_MESSAGES at check time
 *      so plan upgrades take effect on the next request.
 *
 *   B) Hard burst limit of 10 messages per minute per user, regardless of
 *      plan. Prevents a runaway loop from torching the monthly budget in
 *      a few seconds.
 *
 * Both limiters share the same Redis instance; Upstash counts each
 * ratelimit under its own prefix.
 */

export const PLAN_MONTHLY_MESSAGES: Record<string, number> = {
  free: 10,
  professional: 100,
  business: 500,
  enterprise: 10_000,
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazy-init so builds without env (e.g. the lint pass) don't crash. Any
// code path that actually tries to rate-limit will fail loudly if the vars
// aren't set at runtime.
let _redis: Redis | null = null;
function redis(): Redis {
  if (_redis) return _redis;
  if (!redisUrl || !redisToken) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set",
    );
  }
  _redis = new Redis({ url: redisUrl, token: redisToken });
  return _redis;
}

// Per-user burst — 10 messages in 60 seconds.
let _burstLimiter: Ratelimit | null = null;
function burstLimiter(): Ratelimit {
  if (_burstLimiter) return _burstLimiter;
  _burstLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "copilot:burst",
    analytics: true,
  });
  return _burstLimiter;
}

// Per-user monthly budget. We instantiate one limiter per quota ceiling,
// cached, so changing a customer's plan between requests always uses the
// right limiter.
const _monthlyLimiters = new Map<number, Ratelimit>();
function monthlyLimiter(limit: number): Ratelimit {
  const existing = _monthlyLimiters.get(limit);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: redis(),
    // 30 days is close enough to a calendar month for this purpose — the
    // sliding window keeps the counter self-healing.
    limiter: Ratelimit.slidingWindow(limit, "30 d"),
    prefix: `copilot:monthly:${limit}`,
    analytics: true,
  });
  _monthlyLimiters.set(limit, limiter);
  return limiter;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: "burst" | "monthly";
  remaining: number;
  resetAt: number; // epoch ms
  limit: number;
}

/**
 * Check both rate limits for a given user + plan. Returns `allowed: false`
 * with a reason if either limiter is exhausted.
 */
export async function checkQuota({
  userId,
  plan,
}: {
  userId: string;
  plan: string;
}): Promise<QuotaCheck> {
  const monthlyLimit =
    PLAN_MONTHLY_MESSAGES[plan] ?? PLAN_MONTHLY_MESSAGES.free;

  const [burst, monthly] = await Promise.all([
    burstLimiter().limit(`user:${userId}`),
    monthlyLimiter(monthlyLimit).limit(`user:${userId}`),
  ]);

  if (!burst.success) {
    return {
      allowed: false,
      reason: "burst",
      remaining: 0,
      resetAt: burst.reset,
      limit: 10,
    };
  }
  if (!monthly.success) {
    return {
      allowed: false,
      reason: "monthly",
      remaining: 0,
      resetAt: monthly.reset,
      limit: monthlyLimit,
    };
  }

  return {
    allowed: true,
    remaining: monthly.remaining,
    resetAt: monthly.reset,
    limit: monthlyLimit,
  };
}

/**
 * Read-only "how much is left" for the UI, without consuming a credit.
 * The UI calls this to show "7 / 10 messages left this month".
 */
export async function peekMonthlyUsage({
  userId,
  plan,
}: {
  userId: string;
  plan: string;
}): Promise<{ remaining: number; limit: number; resetAt: number }> {
  const monthlyLimit =
    PLAN_MONTHLY_MESSAGES[plan] ?? PLAN_MONTHLY_MESSAGES.free;
  const res = await monthlyLimiter(monthlyLimit).getRemaining(`user:${userId}`);
  return {
    remaining: res.remaining,
    limit: monthlyLimit,
    resetAt: res.reset,
  };
}
