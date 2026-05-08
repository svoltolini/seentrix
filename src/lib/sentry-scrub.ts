/**
 * Recursively redacts known-sensitive field names from any object before
 * Sentry ships it. Used by both the server and edge runtime configs.
 *
 * Why a deny-list rather than allow-list: most of an event payload is
 * already useful (URL paths, query params, error messages). Only a few
 * fields are sensitive but high-impact — passwords, MFA codes, raw
 * Supabase tokens — and they show up under predictable names.
 */
const SENSITIVE_FIELDS = new Set([
  "password",
  "newpassword",
  "newPassword",
  "new_password",
  "currentpassword",
  "currentPassword",
  "current_password",
  "confirmpassword",
  "confirmPassword",
  "confirm_password",
  "passwordconfirm",
  "passwordConfirm",
  "code", // MFA TOTP digits
  "totp",
  "secret",
  "apikey",
  "apiKey",
  "api_key",
  "accesstoken",
  "accessToken",
  "access_token",
  "refreshtoken",
  "refreshToken",
  "refresh_token",
  "authorization",
  "cookie",
]);

const REDACTED = "[REDACTED]";

/**
 * Walk an arbitrary value recursively and replace any sensitive-named
 * field with `[REDACTED]`. Bounded by depth + visited-set to avoid
 * blowing the stack on circular references.
 */
export function scrubSensitive(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 8) return value;
  if (typeof value !== "object") return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => scrubSensitive(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(key.toLowerCase())) {
      out[key] = REDACTED;
    } else {
      out[key] = scrubSensitive(v, depth + 1, seen);
    }
  }
  return out;
}
