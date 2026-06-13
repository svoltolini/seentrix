"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import {
  CRA_STANDARDS,
  type StandardStatus,
} from "@/lib/constants/cra-standards";

/**
 * Read-only reference for harmonised standards & presumption of conformity
 * (CRA Article 27). Surfaces the M/606 standards landscape — what each
 * standard is expected to cover and its current status — so a manufacturer
 * can plan which standard will give presumption of conformity for which
 * Annex I requirements. The dedicated CRA standards are still in development,
 * which the status badges make explicit.
 */

const STATUS_TONE: Record<StandardStatus, { bg: string; fg: string }> = {
  published: { bg: "var(--success)", fg: "var(--success)" },
  in_development: { bg: "var(--warning)", fg: "var(--warning)" },
  potential: { bg: "var(--muted-foreground)", fg: "var(--muted-foreground)" },
};

export function StandardsReference() {
  const t = useTranslations("conformity.standards");

  return (
    <div
      data-reveal
      className="overflow-hidden rounded-lg border border-border bg-card p-[17px]"
    >
      <div className="mb-1 flex items-center gap-2">
        <Icon name="checkmark-badge-01-stroke-rounded" size={18} className="text-primary" />
        <h2 className="text-h4 text-foreground">{t("title")}</h2>
      </div>
      <p className="text-p3 text-muted-foreground">{t("intro")}</p>
      <p className="mt-2 text-l6 text-muted-foreground">{t("statusNote")}</p>

      <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
        {CRA_STANDARDS.map((s) => {
          const tone = STATUS_TONE[s.status];
          const parts = s.coversParts
            .map((p) => t(`part.${p}`))
            .join(" · ");
          return (
            <div key={s.id} className="flex flex-col gap-1.5 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-l6 text-muted-foreground">
                  {s.ref}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tone.bg} 13%, transparent)`,
                    color: tone.fg,
                  }}
                >
                  {t(`status.${s.status}`)}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t(`kind.${s.kind}`)}
                </span>
              </div>
              <p className="text-p3 text-foreground">{t(`standard.${s.id}.title`)}</p>
              <p className="text-l6 text-muted-foreground">
                {t(`standard.${s.id}.note`)}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-l6 text-muted-foreground">
                <span>
                  <span className="text-muted-foreground/70">
                    {t("coversLabel")}:
                  </span>{" "}
                  {parts}
                </span>
                <span className="font-mono text-muted-foreground/70">
                  {s.craArticle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
