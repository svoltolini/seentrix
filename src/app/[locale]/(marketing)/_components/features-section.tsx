"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const modules = [
  { key: "assessment", accent: "#066DE6" },
  { key: "checklist", accent: "#6366F1" },
  { key: "sbom", accent: "#6F4FE0" },
  { key: "documents", accent: "#A855F7" },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing.features");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="scroll-mt-20 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((mod, i) => (
            <div
              key={mod.key}
              data-feature-card
              className="group relative rounded-md bg-muted p-8 transition-colors duration-300 hover:bg-muted"
            >
              <div className="flex items-start gap-5">
                <span
                  className="shrink-0 text-3xl font-extrabold leading-none"
                  style={{ color: mod.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t(`modules.${mod.key}.title`)}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {t(`modules.${mod.key}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
