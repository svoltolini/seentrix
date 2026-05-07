"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { MS_PER_DAY } from "@/lib/time";

/**
 * CRA Timeline — three milestone cards with live countdown chips.
 *
 * The middle milestone (Sept 11 2026 — full enforcement) is the headline
 * date, so it renders as a dark navy hero card and is given visual
 * priority over the other two. Each card carries:
 *   - a status pill (Past / Active / Approaching / Upcoming)
 *   - the date in large type
 *   - title + description
 *   - a countdown chip in the footer
 *
 * Countdown is computed client-side after mount so the SSR shell renders
 * a stable placeholder ("—") and there's no hydration mismatch when the
 * user's clock differs from the build snapshot.
 */
const MILESTONES = [
  { key: "m1", isoDate: "2026-06-01", variant: "secondary" as const },
  { key: "m2", isoDate: "2026-09-11", variant: "hero" as const },
  { key: "m3", isoDate: "2027-12-01", variant: "secondary" as const },
];

type Variant = "secondary" | "hero";

type Status = "past" | "active" | "approaching" | "upcoming";

function statusFor(target: Date, now: Date): { status: Status; daysAway: number } {
  const daysAway = Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
  if (daysAway < 0) return { status: "past", daysAway };
  if (daysAway === 0) return { status: "active", daysAway };
  if (daysAway <= 90) return { status: "approaching", daysAway };
  return { status: "upcoming", daysAway };
}

function formatCountdown(daysAway: number): { value: string; unit: "days" | "weeks" | "months" | "years" } {
  const abs = Math.abs(daysAway);
  if (abs < 14) return { value: String(abs), unit: "days" };
  if (abs < 60) return { value: String(Math.round(abs / 7)), unit: "weeks" };
  if (abs < 365) return { value: String(Math.round(abs / 30)), unit: "months" };
  // 1+ year — show one decimal so "1.5 years" reads naturally.
  return { value: (abs / 365).toFixed(1), unit: "years" };
}

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Re-tick every minute so a long page-open keeps the chip fresh
    // without burning a per-second interval (the headline countdown in
    // the hero already runs at 1 Hz; this section only needs day-grain
    // precision).
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="scroll-mt-20 border-t border-border bg-card py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
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

        <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
          {MILESTONES.map((ms, i) => {
            const target = new Date(`${ms.isoDate}T00:00:00Z`);
            const meta = now ? statusFor(target, now) : null;
            const countdownLabel = (() => {
              if (!meta) return null;
              if (meta.status === "active") return t("countdown.today");
              if (meta.status === "past") {
                const { value } = formatCountdown(meta.daysAway);
                return t("countdown.past", { value });
              }
              const { value, unit } = formatCountdown(meta.daysAway);
              return t(`countdown.${unit}`, { value });
            })();
            return (
              <MilestoneCard
                key={ms.key}
                index={i + 1}
                variant={ms.variant}
                status={meta?.status ?? null}
                date={t(`milestones.${ms.key}.date`)}
                title={t(`milestones.${ms.key}.title`)}
                description={t(`milestones.${ms.key}.description`)}
                statusLabel={meta ? t(`status.${meta.status}`) : null}
                countdownLabel={countdownLabel}
              />
            );
          })}
        </div>

        <p className="mt-10 text-center text-p4 text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}

function MilestoneCard({
  index,
  variant,
  status,
  date,
  title,
  description,
  statusLabel,
  countdownLabel,
}: {
  index: number;
  variant: Variant;
  status: Status | null;
  date: string;
  title: string;
  description: string;
  statusLabel: string | null;
  countdownLabel: string | null;
}) {
  const isHero = variant === "hero";

  return (
    <article
      data-milestone-card
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md p-7 shadow-card-md transition-shadow",
        isHero
          ? "bg-dark-cta text-dark-cta-foreground md:scale-[1.02] md:shadow-card-lg"
          : "border border-border bg-card text-foreground",
      )}
    >
      {/* Index + status pill */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-l6-plus tabular-nums",
            isHero ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {String(index).padStart(2, "0")}
        </span>
        <StatusPill status={status} variant={variant} label={statusLabel ?? ""} />
      </div>

      {/* Date — the hero treatment */}
      <p
        className={cn(
          "mt-7 text-3xl font-bold tracking-tight",
          isHero ? "text-white" : "text-foreground",
        )}
      >
        {date}
      </p>

      {/* Title + description */}
      <h3
        className={cn(
          "mt-3 text-h4",
          isHero ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 flex-1 text-p3",
          isHero ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {description}
      </p>

      {/* Countdown footer */}
      <div
        className={cn(
          "mt-6 flex items-center gap-2 border-t pt-4 text-p3",
          isHero
            ? "border-white/10 text-white/80"
            : "border-border text-muted-foreground",
        )}
      >
        <Icon
          name={status === "past" ? "TickCircle" : "Clock"}
          size={16}
          className={cn(
            "shrink-0",
            isHero ? "text-white/70" : "text-primary",
          )}
        />
        <span className="tabular-nums">
          {countdownLabel ?? "—"}
        </span>
      </div>
    </article>
  );
}

function StatusPill({
  status,
  variant,
  label,
}: {
  status: Status | null;
  variant: Variant;
  label: string;
}) {
  if (status === null) {
    // SSR placeholder — keep the layout height stable until the
    // client-side clock is available.
    return <span className="h-[22px] w-20 rounded-full bg-foreground/5" />;
  }

  const isHero = variant === "hero";

  // Three palettes:
  //   active/approaching → orange (urgent)
  //   upcoming           → blue (future)
  //   past               → muted (done)
  // On the hero card every pill is white-on-translucent so it doesn't
  // fight the navy background; on secondary cards we use the full token.
  const palette = isHero
    ? "bg-white/15 text-white"
    : status === "active" || status === "approaching"
      ? "bg-accent/10 text-accent"
      : status === "past"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-l6-plus uppercase tracking-[1.5px]",
        palette,
      )}
    >
      {(status === "active" || status === "approaching") && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            isHero ? "bg-white" : "bg-accent",
          )}
        />
      )}
      {label}
    </span>
  );
}
