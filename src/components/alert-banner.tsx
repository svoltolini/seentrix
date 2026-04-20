"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

/**
 * Unified alert/attention banner used wherever the dashboard needs to say
 * "here's something that needs your attention." Shared layout, shared
 * decorative backdrop, shared CTA treatment — the only thing that varies
 * is the pulsing dot colour (attention vs critical) so urgency is still
 * readable at a glance.
 *
 * Used by:
 *   - ProfileIncompleteBanner (Declaration of Conformity not ready)
 *   - Dashboard ActionNeededBanner (product at risk before deadline)
 *   - Dashboard ActiveIncidentsBanner (Article 14 countdown)
 *
 * If you need to add another alert: render <AlertBanner> with the right
 * tone + content. Do not roll a new bespoke card — the whole point of
 * this component is that the three existing ones used to look like three
 * different products.
 */
export type AlertTone = "attention" | "critical";

export function AlertBanner({
  tone = "attention",
  eyebrow,
  title,
  description,
  children,
  cta,
  variant = "full",
}: {
  tone?: AlertTone;
  eyebrow: string;
  title: string;
  /** Short one-liner under the title. Supply `children` instead for rich
   *  content (e.g. a stats row). If both are supplied, `children` wins. */
  description?: string;
  children?: ReactNode;
  cta?: { label: string; href: string };
  variant?: "full" | "inline";
}) {
  const dotColor = tone === "critical" ? "#DC2626" : "#F59E0B";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
    >
      <div
        className={cn(
          "flex flex-col gap-5 md:flex-row md:items-center md:justify-between",
          variant === "full" ? "p-6 md:p-8" : "p-5",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <span
              className="size-1.5 animate-pulse rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            {eyebrow}
          </div>
          <h2 className="font-heading text-xl font-bold leading-snug text-white md:text-2xl">
            {title}
          </h2>
          {children ? (
            <div className="mt-3 text-sm text-white/75">{children}</div>
          ) : description ? (
            <p className="mt-2 max-w-xl text-sm text-white/75">{description}</p>
          ) : null}
        </div>

        {cta && (
          <Link
            href={cta.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {cta.label}
            <HugeIcon name="arrow-right-01-stroke-rounded" size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
