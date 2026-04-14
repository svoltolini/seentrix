"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const segments = [
  { key: "industrial", icon: "circuit-board-stroke-rounded" },
  { key: "iot", icon: "chip-stroke-rounded" },
  { key: "software", icon: "visual-studio-code-stroke-rounded" },
] as const;

export function AudienceSection() {
  const t = useTranslations("landing.audience");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const rows = el.querySelectorAll("[data-audience-row]");

    rows.forEach((row) => {
      const icon = row.querySelector("[data-audience-icon]");
      const text = row.querySelector("[data-audience-text]");
      if (!icon || !text) return;

      const isReversed = row.getAttribute("data-reversed") === "true";
      gsap.set(icon, { opacity: 0, x: isReversed ? 40 : -40 });
      gsap.set(text, { opacity: 0, y: 30 });

      gsap.to(icon, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
      gsap.to(text, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.15,
        ease: "power2.out",
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (el.contains(t.trigger as Element)) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border/50 bg-card/50 py-24 lg:py-32"
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

        <div className="flex flex-col gap-16 lg:gap-20">
          {segments.map((seg, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={seg.key}
                data-audience-row
                data-reversed={isReversed}
                className={cn(
                  "flex flex-col items-center gap-8 lg:flex-row lg:gap-16",
                  isReversed && "lg:flex-row-reverse"
                )}
              >
                {/* Icon */}
                <div
                  data-audience-icon
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-[#8B5CF6]/10 lg:h-32 lg:w-32"
                >
                  <HugeIcon
                    name={seg.icon}
                    size={48}
                    className="text-foreground"
                  />
                </div>

                {/* Text */}
                <div data-audience-text className="max-w-md text-center lg:text-left">
                  <h3 className="text-xl font-bold text-foreground">
                    {t(`segments.${seg.key}.title`)}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t(`segments.${seg.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
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
