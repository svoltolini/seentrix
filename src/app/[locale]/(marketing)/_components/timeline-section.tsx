"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const milestones = [
  { key: "m1", color: "#3B82F6" },
  { key: "m2", color: "#8B5CF6" },
  { key: "m3", color: "#F97316" },
] as const;

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Desktop horizontal fill
      if (hLineRef.current) {
        gsap.fromTo(
          hLineRef.current,
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

      // Mobile vertical fill
      if (vLineRef.current) {
        gsap.fromTo(
          vLineRef.current,
          { height: "0%" },
          {
            height: "100%",
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

      // Dot scale + content fade
      const dots = el.querySelectorAll("[data-milestone-dot]");
      const content = el.querySelectorAll("[data-milestone-content]");

      dots.forEach((dot, i) => {
        gsap.from(dot, {
          scale: 0.6,
          opacity: 0.4,
          duration: 0.5,
          scrollTrigger: {
            trigger: dot,
            start: "top 80%",
            once: true,
          },
        });
        if (content[i]) {
          gsap.from(content[i], {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.2,
            scrollTrigger: {
              trigger: dot,
              start: "top 80%",
              once: true,
            },
          });
        }
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

        {/* Horizontal stepper — desktop */}
        <div className="hidden lg:block">
          <div className="mx-auto max-w-5xl">
            <div className="relative flex items-center justify-between">
              {/* Track background */}
              <div className="absolute left-5 right-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
              {/* Gradient fill overlay */}
              <div
                ref={hLineRef}
                className="absolute left-5 top-1/2 h-1 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, #3B82F6, #8B5CF6, #F97316)",
                  width: "0%",
                }}
              />

              {milestones.map((ms, i) => (
                <Fragment key={ms.key}>
                  <div
                    data-milestone-dot
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-md"
                    style={{ backgroundColor: ms.color }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                  {i < milestones.length - 1 && <div className="flex-1" />}
                </Fragment>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              {milestones.map((ms) => (
                <div
                  key={ms.key}
                  data-milestone-content
                  className="flex w-10 flex-col items-center text-center"
                >
                  <div className="flex w-[240px] flex-col items-center rounded-xl border border-border bg-card p-4">
                    <span
                      className="inline-flex rounded-full px-4 py-1 text-sm font-bold text-white"
                      style={{ backgroundColor: ms.color }}
                    >
                      {t(`milestones.${ms.key}.date`)}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-foreground">
                      {t(`milestones.${ms.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`milestones.${ms.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical stepper — mobile/tablet */}
        <div className="lg:hidden">
          <div className="relative flex flex-col gap-10 pl-10">
            {/* Track background */}
            <div className="absolute bottom-0 left-[15px] top-0 w-1 rounded-full bg-border" />
            {/* Gradient fill overlay */}
            <div
              ref={vLineRef}
              className="absolute left-[15px] top-0 w-1 rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, #3B82F6, #8B5CF6, #F97316)",
                height: "0%",
              }}
            />

            {milestones.map((ms) => (
              <div key={ms.key} className="relative">
                <div
                  data-milestone-dot
                  className="absolute -left-10 top-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background shadow-md"
                  style={{ backgroundColor: ms.color }}
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>

                <div data-milestone-content>
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: ms.color }}
                  >
                    {t(`milestones.${ms.key}.date`)}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-foreground">
                    {t(`milestones.${ms.key}.title`)}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t(`milestones.${ms.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
