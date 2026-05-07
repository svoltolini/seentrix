"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const stats = ["stat1", "stat2", "stat3"] as const;

export function ProblemSection() {
  const t = useTranslations("landing.problem");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const items = el.querySelectorAll("[data-stat-card]");
    gsap.set(items, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });

      tl.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
      });

      el.querySelectorAll("[data-counter]").forEach((counter) => {
        const target = counter.getAttribute("data-counter") ?? "";
        const numericMatch = target.match(/[\d.]+/);
        if (!numericMatch) return;

        const endVal = parseFloat(numericMatch[0]);
        const prefix = target.slice(0, target.indexOf(numericMatch[0]));
        const suffix = target.slice(
          target.indexOf(numericMatch[0]) + numericMatch[0].length
        );

        tl.to(
          { val: 0 },
          {
            val: endVal,
            duration: 1.5,
            ease: "power2.out",
            onUpdate() {
              const current = Math.round(this.targets()[0].val);
              counter.textContent = `${prefix}${current}${suffix}`;
            },
          },
          "<0.3"
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border bg-card py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {stats.map((key) => (
            <div
              key={key}
              data-stat-card
              className="flex flex-col items-center text-center"
            >
              <span
                data-counter={t(`stats.${key}.value`)}
                className="text-6xl font-extrabold text-primary sm:text-7xl"
              >
                {t(`stats.${key}.value`)}
              </span>
              <span className="mt-4 text-l5 text-foreground">
                {t(`stats.${key}.label`)}
              </span>
              <p className="mt-3 max-w-xs text-p3 text-muted-foreground">
                {t(`stats.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
