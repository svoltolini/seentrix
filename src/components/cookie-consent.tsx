"use client";

import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Lightweight cookie-consent banner.
 *
 * Only strictly-necessary cookies are set today (session + UI
 * preferences), so the banner is informational rather than consent-gated.
 * The "Got it" click records acknowledgement in localStorage so the
 * banner doesn't reappear.
 *
 * When analytics or marketing cookies are added later, promote this to a
 * proper opt-in UI with per-category toggles + a co-equal "Reject all".
 */
const STORAGE_KEY = "seentrix:cookies:acknowledged";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getAcknowledged(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // private-mode Safari throws; treat as acknowledged (no banner).
    return true;
  }
}

export function CookieConsent() {
  // useSyncExternalStore reads localStorage synchronously on mount without
  // triggering the setState-in-effect lint rule. SSR snapshot returns
  // `true` so the banner never flashes during hydration.
  const acknowledged = useSyncExternalStore(
    subscribe,
    getAcknowledged,
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (acknowledged || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card-lg sm:flex-row sm:items-center md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
    >
      <p className="text-p3 leading-relaxed text-muted-foreground">
        Seentrix only uses strictly-necessary cookies (session and UI
        preferences). No tracking, no ads. Read our{" "}
        <Link
          href="/legal/cookies"
          className="text-l6 text-primary underline-offset-2 hover:underline"
        >
          Cookie Policy
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-sm bg-primary px-4 py-2 text-l6 text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        Got it
      </button>
    </div>
  );
}
