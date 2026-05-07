"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { MS_PER_DAY } from "@/lib/time";

/**
 * CRA Timeline section — Nask vocabulary throughout.
 *
 * Layout:
 *   1) A horizontal time-axis ribbon at the top (mirrors the Nask
 *      Project Timeline day strip — light card, soft shadow, dotted track,
 *      milestone flags + a single orange "Today" tick).
 *   2) Three identical light Nask cards below: white surface, 1.5px
 *      border, shadow-card-md, 28-32px padding, soft chip footer with
 *      the live countdown.
 *
 * The orange `--accent` is reserved (per design-system spec) for the
 * single most-urgent signal: the "Today" tick on the axis and the status
 * pill of any milestone within 90 days. Everything else uses the muted /
 * primary blue tokens. No dark navy on the marketing surface.
 */

const MILESTONES = [
  { key: "m1", isoDate: "2026-06-01" },
  { key: "m2", isoDate: "2026-09-11" },
  { key: "m3", isoDate: "2027-12-01" },
];

// Time-axis bounds. The ribbon spans from the start of the milestone
// year (2026) to a few months past the last milestone, so all marks land
// comfortably inside the track.
const AXIS_START = new Date("2026-01-01T00:00:00Z").getTime();
const AXIS_END = new Date("2028-03-01T00:00:00Z").getTime();
const AXIS_SPAN = AXIS_END - AXIS_START;

type Status = "past" | "active" | "approaching" | "upcoming";

function statusFor(target: Date, now: Date): { status: Status; daysAway: number } {
  const daysAway = Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
  if (daysAway < 0) return { status: "past", daysAway };
  if (daysAway === 0) return { status: "active", daysAway };
  if (daysAway <= 90) return { status: "approaching", daysAway };
  return { status: "upcoming", daysAway };
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

function pctOnAxis(time: number): number {
  return Math.max(0, Math.min(100, ((time - AXIS_START) / AXIS_SPAN) * 100));
}

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Re-tick once a minute so the chip stays accurate without burning
    // a 1Hz interval (the hero already has a per-second countdown).
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

  // Pre-compute axis positions so the ribbon and the cards stay in sync.
  const items = MILESTONES.map((ms, i) => {
    const target = new Date(`${ms.isoDate}T00:00:00Z`);
    const meta = now ? statusFor(target, now) : null;
    return {
      ...ms,
      index: i + 1,
      target,
      meta,
      pct: pctOnAxis(target.getTime()),
    };
  });
  const todayPct = now ? pctOnAxis(now.getTime()) : null;

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

        {/* Time-axis ribbon — Nask Project Timeline pattern: light card,
            very soft shadow, year ticks along the bottom, "Today" pill
            in orange `--accent` (the single urgent signal in the
            section), milestone flags in `--primary`. */}
        <div className="mb-8 hidden rounded-md border border-border bg-card p-7 shadow-card-md md:block">
          <div className="relative">
            {/* Track */}
            <div className="absolute left-0 right-0 top-9 h-px bg-border" />

            {/* Today marker */}
            {todayPct !== null && (
              <div
                className="absolute top-0"
                style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-accent px-2.5 py-1 text-l6-plus uppercase tracking-[1.5px] text-white">
                    {t("axis.today")}
                  </span>
                  <span className="size-3 rounded-full border-[2px] border-card bg-accent shadow-[0_0_0_1.5px_var(--accent)]" />
                </div>
              </div>
            )}

            {/* Milestone flags */}
            {items.map((it) => (
              <div
                key={it.key}
                className="absolute top-7"
                style={{ left: `${it.pct}%`, transform: "translateX(-50%)" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="size-3 rounded-full border-[2px] border-card bg-primary shadow-[0_0_0_1.5px_var(--primary)]" />
                  <span className="whitespace-nowrap text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                    {t(`milestones.${it.key}.shortDate`)}
                  </span>
                </div>
              </div>
            ))}

            {/* Year axis labels — provide stable scaffolding regardless
                of where the markers fall. */}
            <div
              aria-hidden
              className="pt-[88px]"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
              }}
            >
              <span className="text-l6-plus uppercase tracking-[2.5px] text-muted-foreground">
                2026
              </span>
              <span className="text-center text-l6-plus uppercase tracking-[2.5px] text-muted-foreground">
                2027
              </span>
              <span className="text-right text-l6-plus uppercase tracking-[2.5px] text-muted-foreground">
                2028
              </span>
            </div>
          </div>
        </div>

        {/* Three equal Nask cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <MilestoneCard
              key={it.key}
              index={it.index}
              status={it.meta?.status ?? null}
              date={t(`milestones.${it.key}.date`)}
              title={t(`milestones.${it.key}.title`)}
              description={t(`milestones.${it.key}.description`)}
              statusLabel={it.meta ? t(`status.${it.meta.status}`) : null}
              countdownLabel={(() => {
                if (!it.meta) return null;
                if (it.meta.status === "active") return t("countdown.today");
                if (it.meta.status === "past") {
                  const { value } = formatCountdown(it.meta.daysAway);
                  return t("countdown.past", { value });
                }
                const { value, unit } = formatCountdown(it.meta.daysAway);
                return t(`countdown.${unit}`, { value });
              })()}
            />
          ))}
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
  status,
  date,
  title,
  description,
  statusLabel,
  countdownLabel,
}: {
  index: number;
  status: Status | null;
  date: string;
  title: string;
  description: string;
  statusLabel: string | null;
  countdownLabel: string | null;
}) {
  return (
    <article
      data-milestone-card
      className="flex flex-col rounded-md border border-border bg-card p-7 shadow-card-md transition-shadow hover:shadow-card-lg"
    >
      {/* Index + status pill */}
      <div className="flex items-center justify-between">
        <span className="text-3xl font-extrabold leading-none text-primary">
          {String(index).padStart(2, "0")}
        </span>
        <StatusPill status={status} label={statusLabel ?? ""} />
      </div>

      {/* Date */}
      <p className="mt-7 text-h2 text-foreground">{date}</p>

      {/* Title + description */}
      <h3 className="mt-2 text-h4 text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-p3 text-muted-foreground">{description}</p>

      {/* Countdown chip — Nask meta-chip recipe: bg-muted, rounded-md,
          16px icon, text-p4 label. Sits flush left so it reads as
          metadata rather than a CTA. */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-p4 text-foreground">
          <Icon
            name={status === "past" ? "TickCircle" : "Clock"}
            size={14}
            className={cn(
              status === "past" ? "text-muted-foreground" : "text-primary",
            )}
          />
          <span className="tabular-nums">{countdownLabel ?? "—"}</span>
        </span>
      </div>
    </article>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: Status | null;
  label: string;
}) {
  if (status === null) {
    // SSR placeholder — keeps the row height stable until the client
    // clock is available; otherwise the card jumps after hydration.
    return <span className="h-[26px] w-24 rounded-full bg-foreground/5" />;
  }

  // Two palettes only — accent (orange) for the urgent signal,
  // muted for everything else. This keeps orange rare and meaningful
  // (per the design-system spec), and avoids a third pill colour
  // crowding the surface.
  const isUrgent = status === "active" || status === "approaching";
  const palette = isUrgent
    ? "bg-accent/10 text-accent"
    : status === "past"
      ? "bg-muted text-muted-foreground"
      : "bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-l6-plus uppercase tracking-[1.5px]",
        palette,
      )}
    >
      {isUrgent && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
      )}
      {label}
    </span>
  );
}
