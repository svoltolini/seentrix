"use client";

import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

/**
 * Attention banner shown when the org hasn't filled every field required
 * to issue a Declaration of Conformity. Matches the Action Needed dashboard
 * banner's visual language — same rounded decorative image card, same
 * eyebrow chip with a pulsing amber dot, same white CTA — so the user reads
 * the two as "here's something to do next."
 *
 * Rendered on both the dashboard (above all widgets) and Settings →
 * Organization (above the form) so the fix is always one click away.
 */
export function ProfileIncompleteBanner({
  eyebrow,
  title,
  description,
  cta,
  missing,
  href = "/app/settings/organization",
  variant = "full",
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  missing: number;
  href?: string;
  variant?: "full" | "inline";
}) {
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
            <span className="size-1.5 animate-pulse rounded-full bg-[#F59E0B]" />
            {eyebrow}
          </div>
          <h2 className="font-heading text-xl font-bold leading-snug text-white md:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/75">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {missing > 0 ? `${cta} (${missing})` : cta}
          <HugeIcon name="arrow-right-01-stroke-rounded" size={16} />
        </Link>
      </div>
    </div>
  );
}
