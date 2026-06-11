"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const modules = [
  { key: "assessment", accent: "#1f8a5b" },
  { key: "checklist", accent: "#c0892e" },
  { key: "sbom", accent: "#c0892e" },
  { key: "documents", accent: "#FF9E55" },
] as const;

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
        stagger: 0.12,
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
      className="scroll-mt-20 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-h1 tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((mod, i) => (
            <div
              key={mod.key}
              data-feature-card
              className="group relative rounded-lg bg-card p-7 shadow-card-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-md"
            >
              {/* Clay feature card (design `.mk-feature`): a 46px accent-soft
                  serif number tile, then a serif 19/600 title + muted body. */}
              <span className="flex size-[46px] items-center justify-center rounded-[13px] bg-accent-soft font-heading text-[19px] font-semibold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-heading text-[19px] font-semibold tracking-[-0.3px] text-foreground">
                {t(`modules.${mod.key}.title`)}
              </h3>
              <p className="mt-2 text-p2-r text-muted-foreground">
                {t(`modules.${mod.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
