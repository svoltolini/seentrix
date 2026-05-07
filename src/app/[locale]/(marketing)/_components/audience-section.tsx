"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

const segments = [
  { key: "industrial", accent: "#066DE6" },
  { key: "iot", accent: "#6F4FE0" },
  { key: "software", accent: "#FF6D00" },
] as const;

export function AudienceSection() {
  const t = useTranslations("landing.audience");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const rows = el.querySelectorAll("[data-audience-row]");

      rows.forEach((row) => {
        gsap.set(row, { opacity: 0, y: 30 });

        gsap.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: row, start: "top 85%", once: true },
        });
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
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 lg:gap-10">
          {segments.map((seg, i) => (
            <div
              key={seg.key}
              data-audience-row
              className="flex items-start gap-6 rounded-md bg-card p-8 shadow-card-md lg:gap-8"
            >
              <span
                className="shrink-0 text-4xl font-extrabold leading-none lg:text-5xl"
                style={{ color: seg.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="text-h3 text-foreground">
                  {t(`segments.${seg.key}.title`)}
                </h3>
                <p className="mt-3 text-p2-r text-muted-foreground">
                  {t(`segments.${seg.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/auth/signup"
            className={buttonVariants({ size: "lg" })}
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
