"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  selector?: string;
  scale?: number;
  ease?: string;
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.12,
  y = 40,
  duration = 0.8,
  selector,
  scale,
  ease = "power2.out",
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = selector
      ? el.querySelectorAll(selector)
      : el.querySelectorAll(":scope > *");

    if (targets.length === 0) return;

    const fromProps: gsap.TweenVars = { opacity: 0, y };
    if (scale !== undefined) fromProps.scale = scale;
    gsap.set(targets, fromProps);

    const toProps: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    };
    if (scale !== undefined) toProps.scale = 1;

    const ctx = gsap.context(() => {
      gsap.to(targets, toProps);
    }, el);

    return () => ctx.revert();
  }, [stagger, y, duration, selector, scale, ease]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
