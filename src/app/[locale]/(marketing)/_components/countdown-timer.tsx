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
    setTime(calcTimeLeft());
    setMounted(true);
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
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
            <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent sm:text-4xl">
              {mounted ? pad(box.value) : "00"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
              {box.label}
            </span>
          </div>
          {i < boxes.length - 1 && (
            <span className="mb-5 text-xl font-light text-muted-foreground/40 sm:text-2xl">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
