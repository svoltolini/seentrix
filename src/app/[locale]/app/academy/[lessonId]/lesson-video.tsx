"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { LessonVideo } from "@/lib/academy/videos";

/**
 * LessonVideoPlayer — a branded video player for a lesson's AI-generated
 * explainer. Shows the poster with a play overlay until the user starts it,
 * then native controls. Kept deliberately simple (HTML5 <video>) — the asset
 * is a short self-contained clip, so no streaming/HLS is needed.
 */
export function LessonVideoPlayer({
  video,
  title,
}: {
  video: LessonVideo;
  title: string;
}) {
  const t = useTranslations("academy.lesson");
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function play() {
    ref.current?.play();
  }

  const mins = Math.floor(video.durationSeconds / 60);
  const secs = video.durationSeconds % 60;
  const durationLabel =
    mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `0:${String(secs).padStart(2, "0")}`;

  return (
    <figure className="overflow-hidden rounded-md bg-card shadow-card-md">
      <div className="relative aspect-video w-full bg-foreground/5">
        <video
          ref={ref}
          className="size-full object-cover"
          poster={video.poster}
          controls={playing}
          preload="none"
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={video.src} type="video/mp4" />
        </video>

        {!playing && (
          <button
            type="button"
            onClick={play}
            aria-label={t("video.play")}
            className="group absolute inset-0 flex items-center justify-center bg-foreground/15 transition-colors hover:bg-foreground/25"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform group-hover:scale-105">
              <Icon name="Play" size={26} variant="Bold" />
            </span>
          </button>
        )}
      </div>

      <figcaption
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-p4 text-muted-foreground",
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wider text-primary">
          <Icon name="ai-magic-stroke-rounded" size={12} />
          {t("video.badge")}
        </span>
        <span className="truncate">{t("video.caption", { title })}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0 tabular-nums">{durationLabel}</span>
      </figcaption>
    </figure>
  );
}
