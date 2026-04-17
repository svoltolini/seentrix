"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";

/**
 * Eye-catching banner surfaced when the org hasn't filled every field
 * required to issue a Declaration of Conformity. Rendered on both the
 * dashboard (above all other widgets) and Settings → Organization
 * (above the form) so the next action is always one click away.
 *
 * The attention grabber is a slowly-drifting soft-light gradient overlay
 * plus a pulsing alert dot. Motion is GSAP-driven so it respects the
 * global prefers-reduced-motion contract in GsapProvider.
 */
export function ProfileIncompleteBanner({
  title,
  description,
  cta,
  missing,
  href = "/app/settings/organization",
  variant = "full",
}: {
  title: string;
  description: string;
  cta: string;
  missing: number;
  href?: string;
  variant?: "full" | "inline";
}) {
  const washRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    if (washRef.current) {
      tweens.push(
        gsap.to(washRef.current, {
          backgroundPosition: "100% 50%",
          duration: 8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }),
      );
    }
    if (dotRef.current) {
      tweens.push(
        gsap.to(dotRef.current, {
          scale: 1.4,
          opacity: 0.6,
          duration: 1.1,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }),
      );
    }
    return () => tweens.forEach((t) => t.kill());
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
    >
      <div
        ref={washRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(217,119,6,0.55) 0%, rgba(220,38,38,0.25) 35%, rgba(37,99,235,0.35) 70%, rgba(217,119,6,0.55) 100%)",
          backgroundSize: "300% 300%",
          backgroundPosition: "0% 50%",
          mixBlendMode: "soft-light",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/30"
      />

      <div
        className={
          variant === "full"
            ? "relative flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center"
            : "relative flex flex-col items-start justify-between gap-3 p-4 md:flex-row md:items-center"
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            <span
              ref={dotRef}
              className="flex size-5 items-center justify-center rounded-full bg-[#F59E0B]"
            >
              <HugeIcon name="alert-02" size={12} className="text-white" />
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FCD34D]">
              {title}
            </p>
            <p className="mt-1 max-w-xl text-sm text-white/85">{description}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {missing > 0 ? `${cta} (${missing})` : cta}
          <HugeIcon name="arrow-right-01-stroke-rounded" size={14} />
        </Link>
      </div>
    </div>
  );
}
