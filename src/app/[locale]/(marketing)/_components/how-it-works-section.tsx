"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const steps = [
  { key: "s1", accent: "#066DE6" },
  { key: "s2", accent: "#FF6D00" },
  { key: "s3", accent: "#FF6D00" },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-step-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border bg-card py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.key}
              data-step-card
              className="relative rounded-md bg-background p-8"
            >
              <span
                className="text-5xl font-extrabold leading-none"
                style={{ color: step.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-h4 text-foreground">
                {t(`steps.${step.key}.title`)}
              </h3>
              <p className="mt-3 text-p2-r text-muted-foreground">
                {t(`steps.${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
