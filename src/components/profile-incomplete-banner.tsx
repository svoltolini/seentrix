"use client";

import { AlertBanner } from "@/components/alert-banner";

/**
 * Attention banner shown when the org hasn't filled every field required
 * to issue a Declaration of Conformity. Thin wrapper over <AlertBanner>
 * kept as its own export because it's referenced by two separate call
 * sites (dashboard + settings/organization) — renaming them all at once
 * would just create churn for no benefit.
 */
export function ProfileIncompleteBanner({
  eyebrow,
  title,
  description,
  cta,
  href = "/app/settings/organization",
  variant = "full",
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  variant?: "full" | "inline";
}) {
  return (
    <AlertBanner
      tone="attention"
      eyebrow={eyebrow}
      title={title}
      description={description}
      cta={{ label: cta, href }}
      variant={variant}
    />
  );
}
