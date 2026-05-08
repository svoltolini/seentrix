"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export function FaqSection() {
  const t = useTranslations("landing.faq");
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const items = el.querySelectorAll("[data-faq-item]");
    gsap.set(items, { opacity: 0, y: 20 });

    const ctx = gsap.context(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
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
      className="border-t border-border bg-card py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-3">
            {faqKeys.map((key, i) => {
              const isOpen = openIndex === i;
              const panelId = `faq-panel-${key}`;
              const buttonId = `faq-button-${key}`;
              return (
                <div
                  key={key}
                  data-faq-item
                  className="rounded-md border border-border bg-background"
                >
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="text-l5 text-foreground">
                      {t(`items.${key}.question`)}
                    </span>
                    <svg
                      aria-hidden="true"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className={cn(
                        "shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-45"
                      )}
                    >
                      <path
                        d="M10 4v12M4 10h12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn(
                      "grid transition-all duration-200",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-p3 text-muted-foreground">
                        {t(`items.${key}.answer`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
