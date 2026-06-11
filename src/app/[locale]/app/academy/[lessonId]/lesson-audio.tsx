"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import type { LessonAudio } from "@/lib/academy/audio";

/**
 * LessonAudioPlayer — a branded audio player for a lesson's AI-narrated
 * briefing. Custom play/pause + scrubber + time readout over the native
 * <audio> element, styled with design-system tokens. The asset is a short
 * self-contained mp3, so no streaming is needed.
 */
function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LessonAudioPlayer({
  audio,
  title,
}: {
  audio: LessonAudio;
  title: string;
}) {
  const t = useTranslations("academy.lesson");
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Start at 0 and let the real file's metadata set the duration. We do NOT
  // seed from `audio.durationSeconds` because that static value is the English
  // briefing's length, which is wrong for the de/fr/it audio (each language's
  // narration runs a different length). `preload="metadata"` resolves the true
  // duration almost immediately, so the label is correct per language.
  const [duration, setDuration] = useState(0);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    const next = Number(e.target.value);
    el.currentTime = next;
    setCurrent(next);
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
      {/* Play / pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("audio.pause") : t("audio.play")}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
      >
        <Icon name={playing ? "Pause" : "Play"} size={22} variant="Bold" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wider text-primary">
            <Icon name="ai-magic-stroke-rounded" size={11} />
            {t("audio.badge")}
          </span>
          <span className="truncate text-p3 text-foreground">
            {t("audio.caption", { title })}
          </span>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={current}
            onChange={seek}
            aria-label={t("audio.seek")}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-border) ${pct}%)`,
            }}
          />
          <span className="shrink-0 text-p4 tabular-nums text-muted-foreground">
            {fmt(current)} / {duration > 0 ? fmt(duration) : "--:--"}
          </span>
        </div>
      </div>

      <audio
        ref={ref}
        src={audio.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
