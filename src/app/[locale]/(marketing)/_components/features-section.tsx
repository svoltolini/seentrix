"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

const modules = [
  { key: "assessment", icon: "shield-check" },
  { key: "checklist", icon: "checkmark-badge-01-stroke-rounded" },
  { key: "sbom", icon: "package-open-stroke-rounded" },
  { key: "documents", icon: "pdf-01-stroke-rounded" },
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

        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((mod, i) => (
            <div
              key={mod.key}
              data-feature-card
              className={cn(
                "group flex flex-col rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30",
                i === 0 && "md:col-span-2"
              )}
            >
              <div
                className={cn(
                  "mb-6 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-[#8B5CF6]/20",
                  i === 0 ? "h-16 w-16" : "h-14 w-14"
                )}
              >
                <HugeIcon
                  name={mod.icon}
                  size={i === 0 ? 32 : 28}
                  className="text-foreground"
                />
              </div>

              <h3
                className={cn(
                  "font-bold text-foreground",
                  i === 0 ? "text-xl" : "text-lg"
                )}
              >
                {t(`modules.${mod.key}.title`)}
              </h3>

              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {t(`modules.${mod.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
