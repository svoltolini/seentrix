"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import {
  assembleTechnicalFile,
  releaseTechnicalFile,
  newTechnicalFileVersion,
  downloadTechnicalFile,
  archiveTechnicalFile,
  type TechnicalFileState,
} from "./actions";
import type { Coverage } from "@/lib/constants/annex-vii";

const COVERAGE_TONE: Record<Coverage, string> = {
  present: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  missing: "bg-destructive/10 text-destructive",
};
const COVERAGE_DOT: Record<Coverage, string> = {
  present: "bg-success",
  partial: "bg-warning",
  missing: "bg-destructive",
};

export function TechnicalFileContent({
  productId,
  initial,
}: {
  productId: string;
  initial: TechnicalFileState;
}) {
  const t = useTranslations("technical-file");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  const { canWrite, manifest, score, currentStatus } = initial;
  const base = `/app/products/${productId}`;

  function err(code: string | undefined) {
    const key = `errors.${code ?? "generic"}`;
    return t.has(key) ? t(key) : t("errors.generic");
  }

  function handleAssemble() {
    setFeedback(null);
    startTransition(async () => {
      const res = await assembleTechnicalFile(productId);
      if (res.error) return setFeedback({ kind: "error", text: err(res.error) });
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      setFeedback({ kind: "success", text: t("feedback.assembled") });
      router.refresh();
    });
  }

  function handleRelease() {
    setFeedback(null);
    startTransition(async () => {
      const res = await releaseTechnicalFile(productId);
      if (res.error) return setFeedback({ kind: "error", text: err(res.error) });
      setFeedback({ kind: "success", text: t("feedback.released") });
      router.refresh();
    });
  }

  function handleNewVersion() {
    setFeedback(null);
    startTransition(async () => {
      const res = await newTechnicalFileVersion(productId);
      if (res.error) return setFeedback({ kind: "error", text: err(res.error) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h3 text-foreground">{t("title")}</h2>
          <p className="mt-0.5 max-w-2xl text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAssemble}
              disabled={isPending}
            >
              <Icon name="pdf-01-stroke-rounded" size={16} />
              {isPending ? t("actions.assembling") : t("actions.assemble")}
            </Button>
            {currentStatus === "released" ? (
              <Button size="sm" onClick={handleNewVersion} disabled={isPending}>
                <Icon name="Edit" size={16} />
                {t("actions.newVersion")}
              </Button>
            ) : (
              <Button size="sm" onClick={handleRelease} disabled={isPending}>
                <Icon name="checkmark-badge-01-stroke-rounded" size={16} />
                {t("actions.release")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Coverage score */}
      <section className="rounded-lg bg-card p-6 shadow-card-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-h4 text-foreground">{t("coverage.heading")}</h3>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("coverage.summary", {
                present: score.present,
                total: score.total,
              })}
            </p>
          </div>
          <span className="text-h2 text-primary">{score.percent}%</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-xl bg-border">
          <div
            className="h-full rounded-xl bg-accent transition-all"
            style={{ width: `${score.percent}%` }}
          />
        </div>

        {/* Per-point checklist */}
        <div className="mt-5 space-y-2">
          {manifest.map((e) => (
            <div
              key={e.point}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
            >
              <span className="w-10 shrink-0 text-l6 text-muted-foreground">
                {e.ref}
              </span>
              <span className="min-w-0 flex-1 text-p3 text-foreground">
                {t(`points.${e.point}`)}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-l6-plus uppercase tracking-wide",
                  COVERAGE_TONE[e.coverage],
                )}
              >
                <span className={cn("size-1.5 rounded-full", COVERAGE_DOT[e.coverage])} />
                {t(`coverage.${e.coverage}`)}
              </span>
              {e.coverage !== "present" && (
                <Link
                  href={`${base}${e.fixSegment}`}
                  className="shrink-0 text-l6 text-primary hover:underline"
                >
                  {t("coverage.fix")}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Version history */}
      {initial.history.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-h4 text-foreground">{t("history.heading")}</h3>
          <div className="space-y-2">
            {initial.history.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-card-sm"
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-l6-plus uppercase tracking-wide",
                    v.status === "archived"
                      ? "bg-muted text-muted-foreground"
                      : "bg-success/10 text-success",
                  )}
                >
                  {t("history.version", { n: v.version })}
                  {v.status === "archived" ? ` · ${t("history.archived")}` : ""}
                </span>
                <span className="flex-1 text-p3 text-muted-foreground">
                  {v.released_at
                    ? t("history.released", {
                        date: new Date(v.released_at).toLocaleDateString(),
                      })
                    : ""}
                  {v.retention_until
                    ? ` · ${t("history.retainedUntil", {
                        date: new Date(v.retention_until).toLocaleDateString(),
                      })}`
                    : ""}
                </span>
                {v.has_pdf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await downloadTechnicalFile(v.id);
                        if (res.url)
                          window.open(res.url, "_blank", "noopener,noreferrer");
                      })
                    }
                  >
                    <Icon name="pdf-01-stroke-rounded" size={16} />
                    {t("actions.downloadPdf")}
                  </Button>
                )}
                {canWrite && v.status === "released" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await archiveTechnicalFile(productId, v.id);
                        if (res.error)
                          setFeedback({ kind: "error", text: err(res.error) });
                        else router.refresh();
                      })
                    }
                  >
                    {t("actions.archive")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {feedback && (
        <p
          className={cn(
            "rounded-md px-4 py-3 text-p3",
            feedback.kind === "success"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
