"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// The six landing features, ported verbatim from the design's pf-marketing.jsx
// (icon tiles, not numbers). Icon glyphs mapped to our set.
const FEATURES: { key: string; icon: IconName }[] = [
  { key: "scoring", icon: "Verify" },
  { key: "vulnerabilities", icon: "ShieldTick" },
  { key: "documents", icon: "DocumentText" },
  { key: "copilot", icon: "MagicStar" },
  { key: "deadlines", icon: "Calendar" },
  { key: "academy", icon: "Teacher" },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-feature-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
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
      id="features"
      className="scroll-mt-20 py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mx-auto mb-12 max-w-[50ch] text-center">
          <h2 className="font-heading text-[34px] font-medium tracking-[-0.6px] text-foreground">
            {t("title")}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* 6 icon-tile feature cards (design `.mk-features` / `.mk-feature`) */}
        <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              data-feature-card
              className="rounded-lg border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-md"
            >
              <span className="flex size-[46px] items-center justify-center rounded-[13px] bg-accent-soft text-primary">
                <Icon name={f.icon} size={22} variant={f.icon === "MagicStar" ? "Bold" : "Linear"} />
              </span>
              <h3 className="mt-[18px] font-heading text-[19px] font-semibold tracking-[-0.2px] text-foreground">
                {t(`items.${f.key}.title`)}
              </h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                {t(`items.${f.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
