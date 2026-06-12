import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { LearnScreenContext } from "@/components/academy/learn-fab";
import { READINESS_GROUPS } from "@/lib/constants/cra-readiness";
import { loadReadiness } from "./actions";

function ringColor(percent: number): string {
  if (percent >= 80) return "var(--success)";
  if (percent >= 40) return "var(--warning)";
  return "var(--destructive)";
}

export async function ReadinessSection({
  locale,
  productId,
}: {
  locale: string;
  productId: string;
}) {
  const { state } = await loadReadiness(productId);
  if (!state) return null;

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
      <LearnScreenContext screenKey="readiness" />
      <div className="space-y-8">
        <div>
          <h2 className="text-h3 text-foreground">{t("title")}</h2>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Readiness ring */}
        <section className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-card p-[17px]">
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

        {/* Grouped master checklist — same row recipe as the Conformity
            workflow list: a circular status checkbox (filled green check
            when complete, status-colored dot when partial, empty ring when
            missing), title + status, rows in one bordered card. */}
        {READINESS_GROUPS.map((group) => {
          const items = state.items.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="space-y-3">
              <h3 className="text-h4 text-foreground">{t(`groups.${group}`)}</h3>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {items.map((item) => {
                  const color =
                    item.status === "complete"
                      ? "var(--success)"
                      : item.status === "partial"
                        ? "var(--warning)"
                        : item.status === "missing"
                          ? "var(--destructive)"
                          : "var(--border-strong)";
                  return (
                    <div
                      key={item.key}
                      className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border"
                        style={{
                          borderColor: color,
                          backgroundColor:
                            item.status === "complete" ? color : "transparent",
                        }}
                      >
                        {item.status === "complete" && (
                          <Icon
                            name="checkmark-circle-01-stroke-rounded"
                            size={12}
                            className="text-white"
                          />
                        )}
                        {item.status === "partial" && (
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-l6",
                            item.status === "complete"
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {t(`items.${item.key}`)}
                        </span>
                        <span className="block text-p4 text-muted-foreground">
                          {t(`status.${item.status}`)}
                        </span>
                      </span>
                      {item.status !== "complete" &&
                        item.status !== "not_applicable" && (
                          <Link
                            href={`${base}${item.fixSegment}`}
                            className="shrink-0 text-l6 text-primary hover:underline"
                          >
                            {t("fix")}
                          </Link>
                        )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

