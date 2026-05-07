"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const badges = ["iec", "etsi", "gdpr", "eu_data"] as const;

export function TrustSection() {
  const t = useTranslations("landing.trust");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const items = el.querySelectorAll("[data-trust-badge]");
    gsap.set(items, { opacity: 0, y: 20 });

    const ctx = gsap.context(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
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
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-md bg-primary px-8 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
          {/* Soft dot grid overlay so the solid panel doesn't read as flat fill */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-6 text-p1 text-primary-foreground/90">
              {t("subtitle")}
            </p>
            <p className="mt-4 text-p3 text-primary-foreground/80">
              {t("hosting")}
            </p>
          </div>

          <div className="relative mt-12 flex flex-wrap items-center justify-center gap-3">
            {badges.map((key) => (
              <div
                key={key}
                data-trust-badge
                className="rounded-sm border-[1.5px] border-primary-foreground/30 bg-primary-foreground/15 px-5 py-2.5 text-l6 text-primary-foreground backdrop-blur-sm"
              >
                {t(`badges.${key}`)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
