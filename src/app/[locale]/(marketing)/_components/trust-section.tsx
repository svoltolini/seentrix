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
        <div
          className="overflow-hidden rounded-2xl bg-cover bg-center px-8 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24"
          style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {badges.map((key) => (
              <div
                key={key}
                data-trust-badge
                className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white/80 backdrop-blur-sm"
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
