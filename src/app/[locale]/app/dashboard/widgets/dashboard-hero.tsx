"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

/**
 * DashboardHero — the Clay signature screen header (design handoff §3).
 *
 * White hero card (radius 22): eyebrow, a serif greeting headline with the
 * org-wide compliance % as a green <em>, a context line naming what needs
 * attention, and two CTAs. On the right, a large compliance ring (196px,
 * 16 thick) with an Achieved / Remaining legend.
 */
export function DashboardHero({
  firstName,
  percent,
  criticalCount,
  overdueCount,
  nextDeadlineLabel,
  nextDeadlineDays,
  onOpenCopilot,
}: {
  firstName: string | null;
  percent: number;
  criticalCount: number;
  overdueCount: number;
  nextDeadlineLabel: string | null;
  nextDeadlineDays: number | null;
  onOpenCopilot: () => void;
}) {
  const t = useTranslations("dashboard.hero");
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section className="grid items-center gap-10 rounded-2xl border border-border bg-card px-[30px] py-[26px] lg:grid-cols-[1fr_auto]">
      <div>
        <p className="text-[12.5px] font-semibold uppercase tracking-[1px] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 font-heading text-[30px] font-medium leading-[1.18] tracking-[-0.8px] text-foreground text-balance sm:text-[38px]">
          {t.rich(firstName ? "headline" : "headlineNoName", {
            name: firstName ?? "",
            percent: `${clamped}%`,
            em: (chunks) => <em className="not-italic text-primary">{chunks}</em>,
          })}
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
          {t.rich("body", {
            critical: criticalCount,
            overdue: overdueCount,
            strong: (chunks) => (
              <strong className="font-semibold text-foreground">{chunks}</strong>
            ),
          })}{" "}
          {nextDeadlineLabel && nextDeadlineDays !== null && (
            <>
              {t.rich("nextDeadline", {
                deadline: nextDeadlineLabel,
                days: nextDeadlineDays,
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">
                    {chunks}
                  </strong>
                ),
              })}
            </>
          )}
        </p>
        {/* Hero CTA pair — shared base: 12×20 padding (~44px), r12, 14/600,
            8px icon gap. Primary = solid green + trailing arrow; secondary =
            white/ink/1px border + leading spark. Row gap 12px. */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/vulnerability-reports">
            <Button className="h-11 gap-2 rounded-md px-5 text-[14px]">
              {t("reviewCta")}
              <Icon name="ArrowRight" size={16} aria-hidden="true" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-md px-5 text-[14px]"
            onClick={onOpenCopilot}
          >
            <Icon name="ai-magic-stroke-rounded" size={15} aria-hidden="true" />
            {t("copilotCta")}
          </Button>
        </div>
      </div>

      {/* Compliance ring + legend */}
      <div className="flex flex-col items-center gap-4 justify-self-center">
        <HeroRing value={clamped} caption={t("ringCaption")} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex items-center gap-2 whitespace-nowrap text-[12.5px] text-muted-foreground">
            <i className="size-2.5 rounded-full bg-primary" aria-hidden />
            {t("legendAchieved", { percent: clamped })}
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap text-[12.5px] text-muted-foreground">
            <i
              className="size-2.5 rounded-full"
              style={{ background: "var(--primary-3)" }}
              aria-hidden
            />
            {t("legendRemaining", { percent: 100 - clamped })}
          </span>
        </div>
      </div>
    </section>
  );
}

function HeroRing({ value, caption }: { value: number; caption: string }) {
  const size = 196;
  const thickness = 16;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${value}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary-3)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[46px] font-semibold leading-none tracking-[-1px] text-foreground">
          {value}
          <span className="text-[22px] text-muted-foreground">%</span>
        </span>
        <span className="mt-1 text-[13px] text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}
