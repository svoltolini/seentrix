"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const CRA_DATE = new Date("2026-09-11T00:00:00Z").getTime();

function calcTimeLeft() {
  const diff = CRA_DATE - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer() {
  const t = useTranslations("landing.hero.countdown");
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Drive every update (including the first) from the interval callback so
    // we never call setState synchronously in the effect body. We render a
    // neutral "00" placeholder until `mounted` flips, avoiding an SSR/client
    // hydration mismatch on the live clock.
    const tick = () => {
      setTime(calcTimeLeft());
      setMounted(true);
    };
    const id = setInterval(tick, 1000);
    // Kick off the first tick on the next frame instead of inline.
    const raf = requestAnimationFrame(tick);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, []);

  const boxes = [
    { value: time.days, label: t("days") },
    { value: time.hours, label: t("hours") },
    { value: time.minutes, label: t("minutes") },
    { value: time.seconds, label: t("seconds") },
  ] as const;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {boxes.map((box, i) => (
        <div key={box.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-heading text-[34px] font-semibold tabular-nums tracking-[-0.5px] text-foreground sm:text-[40px]">
              {mounted ? pad(box.value) : "00"}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
              {box.label}
            </span>
          </div>
          {i < boxes.length - 1 && (
            <span className="mb-5 font-heading text-2xl font-normal text-muted-foreground">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
