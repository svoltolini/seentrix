"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MS_PER_DAY } from "@/lib/time";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * CRA Timeline section — three equal Nask cards.
 *
 * Each card is a light Nask card (white surface, 1.5px border,
 * shadow-card-md, rounded-md, 28-32px padding) carrying:
 *   - the milestone index in extra-bold primary blue (matches
 *     FeaturesSection numbering),
 *   - the date as the prominent heading,
 *   - title + description,
 *   - a footer meta-chip with a live countdown ("≈4 months away").
 *
 * Status pills + the time-axis ribbon were tried earlier and removed —
 * the cards alone read cleaner and the countdown chip already conveys
 * urgency without an extra coloured pill.
 */

const MILESTONES = [
  { key: "m1", isoDate: "2026-06-01" },
  { key: "m2", isoDate: "2026-09-11" },
  { key: "m3", isoDate: "2027-12-01" },
];

function daysUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
}

function formatCountdown(daysAway: number): {
  value: string;
  unit: "days" | "weeks" | "months" | "years";
} {
  const abs = Math.abs(daysAway);
  if (abs < 14) return { value: String(abs), unit: "days" };
  if (abs < 60) return { value: String(Math.round(abs / 7)), unit: "weeks" };
  if (abs < 365) return { value: String(Math.round(abs / 30)), unit: "months" };
  return { value: (abs / 365).toFixed(1), unit: "years" };
}

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Set the first value on the next frame rather than synchronously in the
    // effect body (avoids a cascading render). Day-grain precision is enough —
    // re-tick once a minute so the chip stays accurate without burning a 1Hz
    // interval (the hero countdown already runs at 1Hz).
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const cards = el.querySelectorAll("[data-milestone-card]");
      gsap.set(cards, { opacity: 0, y: 24 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="scroll-mt-20 bg-accent-soft py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-heading text-[34px] font-medium tracking-[-0.6px] text-foreground">
            {t("title")}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Horizontal milestone track (design `.mk-tl`) — dots, mono accent
            dates, titles; faint green connector line between dots on desktop. */}
        <div className="mx-auto flex max-w-[880px] flex-col gap-10 md:flex-row md:gap-0">
          {MILESTONES.map((ms, i) => {
            const target = new Date(`${ms.isoDate}T00:00:00Z`);
            const daysAway = now ? daysUntil(target, now) : null;
            return (
              <div
                key={ms.key}
                data-milestone-card
                className="relative flex-1 text-center md:pt-[30px]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[5px] hidden h-0.5 md:block",
                    i === 0
                      ? "left-1/2 right-0"
                      : i === MILESTONES.length - 1
                        ? "left-0 right-1/2"
                        : "inset-x-0",
                  )}
                  style={{
                    background: "color-mix(in srgb, var(--primary) 30%, transparent)",
                  }}
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-0 hidden size-3 -translate-x-1/2 rounded-full bg-primary md:block"
                />
                <p className="font-mono text-[12px] font-semibold text-primary">
                  {t(`milestones.${ms.key}.date`)}
                </p>
                <p className="mt-2 px-3 text-[14px] font-semibold text-foreground">
                  {t(`milestones.${ms.key}.title`)}
                </p>
                {daysAway !== null && daysAway > 0 && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {(() => {
                      const { value, unit } = formatCountdown(daysAway);
                      return t(`countdown.${unit}`, { value });
                    })()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-[12px] text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
