"use client";

import { useEffect, useState } from "react";

/**
 * Reads `prefers-reduced-motion: reduce` and re-renders if the user
 * flips the OS setting mid-session.
 *
 * Returns `null` until the first effect tick — wrap GSAP / Framer
 * tweens in `if (reduced === true) return;` so we don't initialise an
 * animation we'd just have to skip. Returning `null` (not `false`)
 * during SSR matches the "haven't measured yet" state and avoids a
 * flash where reduced-motion users still see the first frame of a
 * transform before the effect runs.
 *
 * Usage:
 *
 *     const reduced = useReducedMotion();
 *     useEffect(() => {
 *       if (reduced) return; // skip animation entirely
 *       const ctx = gsap.context(() => { ... }, el);
 *       return () => ctx.revert();
 *     }, [reduced]);
 */
export function useReducedMotion(): boolean | null {
  // Lazy initializer: read the media query during the first client render
  // instead of synchronously inside an effect (which triggers a cascading
  // re-render). Stays `null` during SSR where `window` is unavailable.
  const [reduced, setReduced] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Subscribe only; the initial value comes from the lazy initializer above.
    // Attaching the listener immediately catches any change since first render.
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
