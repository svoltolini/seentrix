"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const steps = [
  { key: "s1", accent: "#1f8a5b" },
  { key: "s2", accent: "#c0892e" },
  { key: "s3", accent: "#c0892e" },
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
      className="border-t border-border bg-card py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-heading text-[34px] font-medium tracking-[-0.6px] text-foreground">
            {t("title")}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Numbered steps (design `.mk-steps` / `.mk-step`): a 38px
            accent-soft serif number tile, serif title, muted body. */}
        <div className="grid gap-[22px] md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.key} data-step-card className="pt-2">
              <span className="flex size-[38px] items-center justify-center rounded-xl bg-accent-soft font-heading text-[18px] font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 font-heading text-[19px] font-semibold tracking-[-0.2px] text-foreground">
                {t(`steps.${step.key}.title`)}
              </h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                {t(`steps.${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
