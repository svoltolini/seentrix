"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact" | "invisible";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SCRIPT_ID = "cf-turnstile-script";

/**
 * Cloudflare Turnstile widget.
 *
 * Renders the official challenge into a div. The widget calls
 * `onToken` once the user passes the challenge with the verification
 * token; pass that token back to the server alongside the form data
 * and exchange it via `verifyTurnstile()`.
 *
 * Behaviour:
 *   - Loads the Turnstile script once per page (idempotent — multiple
 *     widgets on a page reuse it).
 *   - Renders nothing if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set,
 *     so dev environments without a Cloudflare account still show the
 *     form. The server-side `verifyTurnstile` matches this no-op so
 *     submissions still go through.
 *   - Cleans up the widget on unmount to avoid stale renders when the
 *     parent re-keys the form.
 *
 * Pair with `appearance="interaction-only"` (the default) so the
 * challenge only renders the visible widget when the user actually
 * needs to interact — no clutter on the form for normal traffic.
 */
export function Turnstile({
  onToken,
  onExpire,
  className,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    function loadScript(): Promise<void> {
      if (window.turnstile) return Promise.resolve();
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        return new Promise((resolve) => {
          existing.addEventListener("load", () => resolve(), { once: true });
        });
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.id = SCRIPT_ID;
      document.head.appendChild(script);
      return new Promise((resolve) => {
        script.addEventListener("load", () => resolve(), { once: true });
      });
    }

    loadScript().then(() => {
      if (cancelled || !container || !window.turnstile) return;
      // `sitekey` is captured in the closure but TypeScript can't see
      // through the if-guard above the closure. Re-assert.
      if (!sitekey) return;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey,
        appearance: "interaction-only",
        size: "flexible",
        callback: onToken,
        "expired-callback": onExpire,
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be gone; nothing to do.
        }
        widgetIdRef.current = null;
      }
    };
    // We deliberately don't depend on the callbacks — the widget is
    // single-use and we don't want to re-render it just because the
    // parent recreated its handler reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitekey]);

  if (!sitekey) return null;
  return <div ref={containerRef} className={className} />;
}
