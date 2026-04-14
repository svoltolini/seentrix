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
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.12,
  y = 40,
  duration = 0.8,
  selector,
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

    gsap.set(targets, { opacity: 0, y });

    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, y, duration, selector]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
