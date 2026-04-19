"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Small client-side dismiss button for the screen training banner.
 *
 * The banner parent is rendered server-side (for fast, hydration-free
 * display). This button remembers the dismissed state in localStorage
 * keyed by (user, screen), and hides the enclosing banner element if
 * already dismissed.
 *
 * Because the parent is a server component we can't hide it from a prop
 * — the mount effect finds the ancestor via `data-screen-training-
 * banner` and toggles its display.
 */
export function BannerDismiss({
  storageKey,
  screenKey,
  children,
}: {
  storageKey: string;
  screenKey: string;
  children: ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "1") {
        const el = document.querySelector(
          `[data-screen-training-banner="${screenKey}"]`,
        ) as HTMLElement | null;
        if (el) el.style.display = "none";
      }
    } catch {
      // localStorage can throw in private-mode Safari; treat as not-dismissed.
    }
  }, [storageKey, screenKey]);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
    const el = document.querySelector(
      `[data-screen-training-banner="${screenKey}"]`,
    ) as HTMLElement | null;
    if (el) el.style.display = "none";
  }

  if (dismissed) return null;

  return (
    <button
      type="button"
      onClick={handleDismiss}
      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
    >
      {children}
    </button>
  );
}
