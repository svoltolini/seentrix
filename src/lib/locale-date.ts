"use client";

/**
 * Format dates/times with a pinned locale tag so the server and client
 * render identically (no hydration mismatch). `toLocaleDateString()` without
 * a tag picks the runtime's default locale — Node on the server, the
 * browser on the client — which disagree whenever the host OS locale
 * differs from the app locale.
 *
 * The product is English-only, so the tag is fixed to `en-US`.
 */
const TAG = "en-US";

export function useLocaleDate() {
  return {
    tag: TAG,
    formatDate: (input: string | Date) =>
      new Date(input).toLocaleDateString(TAG),
    formatDateTime: (input: string | Date) =>
      new Date(input).toLocaleString(TAG),
    formatShortMonthDay: (input: string | Date) =>
      new Date(input).toLocaleDateString(TAG, {
        month: "short",
        day: "numeric",
      }),
  };
}
