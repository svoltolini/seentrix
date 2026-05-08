"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registers the ScrollTrigger plugin once per route subtree. Each
 * marketing section that uses GSAP also registers it locally (idempotent),
 * but doing it here means the plugin is ready before the first tween
 * fires.
 *
 * Reduced-motion handling lives per-section via `useReducedMotion`
 * (src/hooks/use-reduced-motion.ts) — each section early-returns from
 * its tween-setup effect rather than relying on a global `timeScale(100)`
 * hack, which only sped up tweens already on the global timeline and
 * left ScrollTrigger-driven tweens at full speed.
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  return <>{children}</>;
}
