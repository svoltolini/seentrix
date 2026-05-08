"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
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
    setNow(new Date());
    // Day-grain precision is enough — re-tick once a minute so the chip
    // stays accurate without burning a 1Hz interval (the hero countdown
    // already runs at 1Hz).
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
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
      className="scroll-mt-20 border-t border-border bg-background py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-l6-plus uppercase tracking-[2.5px] text-primary">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-p1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MILESTONES.map((ms, i) => {
            const target = new Date(`${ms.isoDate}T00:00:00Z`);
            const daysAway = now ? daysUntil(target, now) : null;
            const isPast = daysAway !== null && daysAway < 0;
            const countdownLabel = (() => {
              if (daysAway === null) return null;
              if (daysAway === 0) return t("countdown.today");
              if (isPast) {
                const { value } = formatCountdown(daysAway);
                return t("countdown.past", { value });
              }
              const { value, unit } = formatCountdown(daysAway);
              return t(`countdown.${unit}`, { value });
            })();
            return (
              <MilestoneCard
                key={ms.key}
                index={i + 1}
                date={t(`milestones.${ms.key}.date`)}
                title={t(`milestones.${ms.key}.title`)}
                description={t(`milestones.${ms.key}.description`)}
                countdownLabel={countdownLabel}
                isPast={isPast}
              />
            );
          })}
        </div>

        <p className="mt-8 text-center text-p4 text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}

function MilestoneCard({
  index,
  date,
  title,
  description,
  countdownLabel,
  isPast,
}: {
  index: number;
  date: string;
  title: string;
  description: string;
  countdownLabel: string | null;
  isPast: boolean;
}) {
  return (
    <article
      data-milestone-card
      className="flex flex-col rounded-md border border-border bg-card p-7 shadow-card-md transition-shadow hover:shadow-card-lg"
    >
      {/* Index */}
      <span className="text-3xl font-extrabold leading-none text-primary">
        {String(index).padStart(2, "0")}
      </span>

      {/* Date */}
      <p className="mt-7 text-h2 text-foreground">{date}</p>

      {/* Title + description */}
      <h3 className="mt-2 text-h4 text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-p3 text-muted-foreground">{description}</p>

      {/* Countdown chip — Nask meta-chip recipe (bg-muted, rounded-md,
          14px icon, text-p4 label). Stable SSR placeholder until the
          client clock is available so the card height doesn't jump
          on hydration. */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-p4 text-foreground">
          <Icon
            name={isPast ? "TickCircle" : "Clock"}
            size={14}
            className={cn(isPast ? "text-muted-foreground" : "text-primary")}
          />
          <span className="tabular-nums">{countdownLabel ?? "—"}</span>
        </span>
      </div>
    </article>
  );
}
