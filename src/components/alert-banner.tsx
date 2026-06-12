"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * Unified alert / attention banner. Restyled for Nask: gradient hero motif
 * (matches Detail-Dashboard `41:1171`) with a status-tinted eyebrow chip
 * and a flat white CTA. Used for "needs your attention" callouts on the
 * dashboard and settings pages.
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
  description?: string;
  children?: ReactNode;
  cta?: { label: string; href: string };
  variant?: "full" | "inline";
}) {
  const isCritical = tone === "critical";

  return (
    <div
      className="relative overflow-hidden rounded-md text-white"
      style={{
        backgroundImage: isCritical
          ? "linear-gradient(135deg, #2b2a26 0%, #c0892e 55%, #c0453a 110%)"
          : "linear-gradient(135deg, #1f8a5b 0%, #2fa56f 55%, #2fa56f 110%)",
      }}
    >
      {/* Decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/15 blur-3xl"
      />
      <div
        className={cn(
          "relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between",
          variant === "full" ? "p-6 md:p-8" : "p-5",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
            <span
              className={cn(
                "size-1.5 animate-pulse rounded-full",
                isCritical ? "bg-destructive" : "bg-accent",
              )}
            />
            {eyebrow}
          </div>
          <h2 className="text-h2 text-white md:text-h1">{title}</h2>
          {children ? (
            <div className="mt-3 text-p2 text-white">{children}</div>
          ) : description ? (
            <p className="mt-2 text-p2 text-white">{description}</p>
          ) : null}
        </div>

        {cta && (
          <Link
            href={cta.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-white px-5 py-2.5 text-l5 text-foreground transition-colors hover:bg-white/90"
          >
            {cta.label}
            <Icon name="arrow-right-01-stroke-rounded" size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
