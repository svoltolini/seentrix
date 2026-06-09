import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";
import { READINESS_GROUPS, type ItemStatus } from "@/lib/constants/cra-readiness";
import { loadReadiness } from "./actions";

const STATUS_TONE: Record<ItemStatus, string> = {
  complete: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  missing: "bg-destructive/10 text-destructive",
  not_applicable: "bg-muted text-muted-foreground",
};
const STATUS_DOT: Record<ItemStatus, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  missing: "bg-destructive",
  not_applicable: "bg-muted-foreground/40",
};

function ringColor(percent: number): string {
  if (percent >= 80) return "var(--success)";
  if (percent >= 40) return "var(--warning)";
  return "var(--destructive)";
}

export default async function ReadinessPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  const { state } = await loadReadiness(productId);
  if (!state) notFound();

  const t = await getTranslations({ locale, namespace: "readiness" });
  const base = `/app/products/${productId}`;

  // SVG ring geometry
  const SIZE = 132;
  const STROKE = 12;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const pct = state.score.percent;

  return (
    <>
      <ScreenTrainingBanner screenKey="readiness" />
      <div className="space-y-8">
        <div>
          <h2 className="text-h3 text-foreground">{t("title")}</h2>
          <p className="mt-0.5 max-w-2xl text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Readiness ring */}
        <section className="flex flex-wrap items-center gap-6 rounded-md bg-card p-6 shadow-card-sm">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="-rotate-90">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--border)" strokeOpacity="0.25" strokeWidth={STROKE} />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={ringColor(pct)}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - pct / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-h2 text-foreground">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-h4 text-foreground">{t("ring.heading")}</p>
            <p className="mt-1 text-p3 text-muted-foreground">
              {t("ring.summary", {
                complete: state.score.complete,
                total: state.score.applicable,
              })}
            </p>
            <p className="mt-0.5 text-p4 text-muted-foreground">
              {t("ring.breakdown", {
                partial: state.score.partial,
                missing: state.score.missing,
              })}
            </p>
          </div>
        </section>

        {/* Grouped master checklist */}
        {READINESS_GROUPS.map((group) => {
          const items = state.items.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="space-y-3">
              <h3 className="text-h4 text-foreground">{t(`groups.${group}`)}</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center gap-3 rounded-md bg-card px-4 py-3 shadow-card-sm"
                  >
                    <span className="min-w-0 flex-1 text-p3 text-foreground">
                      {t(`items.${item.key}`)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-l6-plus uppercase tracking-wide",
                        STATUS_TONE[item.status],
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", STATUS_DOT[item.status])} />
                      {t(`status.${item.status}`)}
                    </span>
                    {item.status !== "complete" && item.status !== "not_applicable" && (
                      <Link
                        href={`${base}${item.fixSegment}`}
                        className="shrink-0 text-l6 text-primary hover:underline"
                      >
                        {t("fix")}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export const metadata = { title: "CRA Readiness" };
