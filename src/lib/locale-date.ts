"use client";

import { useLocale } from "next-intl";

/**
 * Format dates/times with a pinned locale tag so the server and client
 * render identically (no hydration mismatch). `toLocaleDateString()` without
 * a tag picks the runtime's default locale — Node on the server, the
 * browser on the client — which disagree whenever the host OS locale
 * differs from the app locale.
 */
export function useLocaleDate() {
  const locale = useLocale();
  const tag = locale === "de" ? "de-DE" : "en-US";
  return {
    tag,
    formatDate: (input: string | Date) =>
      new Date(input).toLocaleDateString(tag),
    formatDateTime: (input: string | Date) =>
      new Date(input).toLocaleString(tag),
    formatShortMonthDay: (input: string | Date) =>
      new Date(input).toLocaleDateString(tag, {
        month: "short",
        day: "numeric",
      }),
  };
}
