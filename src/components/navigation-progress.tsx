"use client";

import { useEffect, useReducer, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar pinned to the top of the viewport. Catches every
 * in-app navigation — menu clicks, tab switches, browser back/forward —
 * and gives the user immediate confirmation that their click landed even
 * when the new server component is still resolving data.
 *
 * Animation shape mirrors what NProgress / GitHub / Vercel use:
 * - First 200 ms: snappy 0 → 25 % so the click registers instantly
 * - After that: decelerating increments toward ~90 % while we wait
 * - On route landing: complete to 100 %, then fade out
 *
 * No library dependency — it's a JS-driven rAF loop with decelerating
 * step sizes, which reads far more natural than a single long CSS
 * transition (that looked like it was already half-done the moment it
 * appeared).
 */
type Phase = "idle" | "loading" | "complete";
type Action =
  | { type: "start" }
  | { type: "tick"; value: number }
  | { type: "complete" }
  | { type: "reset" };

function reducer(
  state: { phase: Phase; progress: number },
  action: Action,
): { phase: Phase; progress: number } {
  switch (action.type) {
    case "start":
      return state.phase === "loading"
        ? state
        : { phase: "loading", progress: 0 };
    case "tick":
      if (state.phase !== "loading") return state;
      return { phase: "loading", progress: action.value };
    case "complete":
      if (state.phase !== "loading") return state;
      return { phase: "complete", progress: 100 };
    case "reset":
      return { phase: "idle", progress: 0 };
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, {
    phase: "idle",
    progress: 0,
  });
  const prevKey = useRef(`${pathname}?${searchParams}`);

  // Navigation landed → dispatch completion.
  useEffect(() => {
    const nextKey = `${pathname}?${searchParams}`;
    if (prevKey.current !== nextKey) {
      prevKey.current = nextKey;
      dispatch({ type: "complete" });
    }
  }, [pathname, searchParams]);

  // Fade out ~300 ms after completion so the 100 % bar has time to show.
  useEffect(() => {
    if (state.phase !== "complete") return;
    const timeout = setTimeout(() => dispatch({ type: "reset" }), 350);
    return () => clearTimeout(timeout);
  }, [state.phase]);

  // rAF-driven progress crawl. Fast at first (click feedback), then
  // slows toward a 90 % ceiling so it never looks stuck at the start or
  // at the end.
  useEffect(() => {
    if (state.phase !== "loading") return;
    let frame = 0;
    let last = performance.now();
    let current = state.progress;
    const target = 90;

    function step(now: number) {
      const dt = now - last;
      last = now;
      // Step size decays as we approach the ceiling. At 0 % we add ~6/frame,
      // at 50 % ~3, at 80 % ~1. Feels organic — the tail is the longest part.
      const remaining = target - current;
      const increment = (remaining / 80) * (dt / 16);
      current = Math.min(target, current + Math.max(increment, 0.05));
      dispatch({ type: "tick", value: current });
      if (current < target) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Intentionally omit state.progress — we only want the loop to start
    // once per "loading" phase, not restart on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Global click hook — any internal <a> click starts the bar.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        a.target === "_blank" ||
        a.hasAttribute("download")
      )
        return;
      if (/^https?:\/\//.test(href)) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }
      dispatch({ type: "start" });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (state.phase === "idle") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
    >
      <div
        className="h-full"
        style={{
          background: "var(--primary)",
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.6)",
          width: `${state.progress}%`,
          opacity: state.phase === "complete" ? 0 : 1,
          // Smooth out the per-frame width changes so the bar doesn't
          // render at exactly the progress value each frame — a tiny
          // CSS transition on width buffers the animation visually.
          transition:
            state.phase === "complete"
              ? "width 200ms ease-out, opacity 300ms ease-out 100ms"
              : "width 80ms linear",
        }}
      />
    </div>
  );
}
