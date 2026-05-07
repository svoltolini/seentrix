"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const milestones = [
  { key: "m1", color: "#066DE6" },
  { key: "m2", color: "#6F4FE0" },
  { key: "m3", color: "#FF6D00" },
] as const;

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { width: "0%" },
          {
            width: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              end: "bottom 60%",
              scrub: 0.5,
            },
          }
        );
      }

      const cards = el.querySelectorAll("[data-milestone-card]");
      gsap.set(cards, { opacity: 0, y: 30 });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.7,
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
  }, []);

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="scroll-mt-20 border-t border-border/50 bg-card/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Horizontal stepper */}
        <div className="relative">
          {/* Line track — spans from first dot center to last dot center */}
          {/* Each column is 1/3 width, dot is centered, so line goes from 1/6 to 5/6 */}
          <div
            ref={trackRef}
            className="absolute top-[9px] hidden h-[2px] bg-border/40 md:block"
            style={{ left: "calc(100% / 6)", right: "calc(100% / 6)" }}
          />
          <div
            ref={lineRef}
            className="absolute top-[9px] hidden h-[2px] md:block"
            style={{
              left: "calc(100% / 6)",
              width: "0%",
              maxWidth: "calc(100% * 4 / 6)",
              background: "linear-gradient(to right, #066DE6, #6F4FE0, #FF6D00)",
            }}
          />

          <div className="grid gap-10 md:grid-cols-3">
            {milestones.map((ms) => (
              <div key={ms.key} data-milestone-card className="flex flex-col items-center text-center">
                {/* Dot */}
                <div className="relative mb-6">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: ms.color }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full blur-[8px] opacity-50"
                    style={{ background: ms.color }}
                  />
                </div>

                {/* Content — no card background */}
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: ms.color }}
                >
                  {t(`milestones.${ms.key}.date`)}
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {t(`milestones.${ms.key}.title`)}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t(`milestones.${ms.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
