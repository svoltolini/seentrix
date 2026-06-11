"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import {
  inherentRisk,
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RESIDUAL_LEVELS,
  type RiskBand,
} from "@/lib/constants/risk-matrix";
import {
  saveRiskAssessment,
  releaseRiskAssessment,
  reviseRiskAssessment,
  generateVersionPdf,
  downloadVersionPdf,
  type RiskAssessmentState,
  type RaItem,
  type RaContextInput,
} from "./actions";

const TONE_CLASS: Record<RiskBand, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-accent/10 text-accent",
};

const SELECT_CLASS = cn(
  "h-10 w-full rounded-md bg-input px-3 text-p3 text-foreground transition-colors outline-none",
  "focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
);

function RiskPill({ band, label }: { band: RiskBand; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-l6-plus uppercase tracking-wide",
        TONE_CLASS[band],
      )}
    >
      {label}
    </span>
  );
}

export function RiskAssessmentContent({
  productId,
  initial,
}: {
  productId: string;
  initial: RiskAssessmentState;
}) {
  const t = useTranslations("risk-assessment");
  const tReq = useTranslations("checklist");
  const router = useRouter();

  const [context, setContext] = useState<RaContextInput>(initial.context);
  const [items, setItems] = useState<RaItem[]>(initial.items);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  const { canWrite, readOnly, status, version } = initial;
  const editable = canWrite && !readOnly;

  const levelLabel = (v: string) => t(`levels.${v}`);

  const mappedCount = useMemo(
    () =>
      items.filter(
        (it) =>
          (it.applicability === "applies" && it.implementation.trim()) ||
          (it.applicability === "not_applicable" && it.justification.trim()),
      ).length,
    [items],
  );

  function updateItem(id: string, patch: Partial<RaItem>) {
    setItems((prev) =>
      prev.map((it) => (it.requirementId === id ? { ...it, ...patch } : it)),
    );
  }

  function toItemInput(it: RaItem) {
    return {
      requirementId: it.requirementId,
      applicability: it.applicability,
      threat: it.threat,
      likelihood: it.likelihood ?? ("" as const),
      impact: it.impact ?? ("" as const),
      implementation: it.implementation,
      residualRisk: it.residualRisk ?? ("" as const),
      justification: it.justification,
    };
  }

  function err(code: string | undefined) {
    const key = `errors.${code ?? "generic"}`;
    return t.has(key) ? t(key) : t("errors.generic");
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveRiskAssessment(productId, context, items.map(toItemInput));
      if (res.error) {
        setFeedback({ kind: "error", text: err(res.error) });
        return;
      }
      setFeedback({ kind: "success", text: t("feedback.saved") });
      router.refresh();
    });
  }

  function handleRelease() {
    setFeedback(null);
    startTransition(async () => {
      // Persist the working copy first — release reads items from the DB.
      const saved = await saveRiskAssessment(productId, context, items.map(toItemInput));
      if (saved.error) {
        setFeedback({ kind: "error", text: err(saved.error) });
        return;
      }
      const res = await releaseRiskAssessment(productId);
      if (res.error) {
        setFeedback({
          kind: "error",
          text:
            res.error === "incomplete"
              ? t("feedback.releaseIncomplete", { count: res.missing ?? 0 })
              : err(res.error),
        });
        return;
      }
      router.refresh();
    });
  }

  function handleRevise() {
    setFeedback(null);
    startTransition(async () => {
      const res = await reviseRiskAssessment(productId);
      if (res.error) {
        setFeedback({ kind: "error", text: err(res.error) });
        return;
      }
      router.refresh();
    });
  }

  function handleGeneratePdf() {
    if (!initial.assessmentId) return;
    startTransition(async () => {
      const res = await generateVersionPdf(productId, initial.assessmentId!);
      if (res.error) {
        setFeedback({ kind: "error", text: err(res.error) });
        return;
      }
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  const partI = items.filter((it) => it.part === "part_i");
  const partII = items.filter((it) => it.part === "part_ii");

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
        <div className="flex flex-wrap items-center gap-2">
          {status && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-l6-plus uppercase tracking-wider",
                status === "released"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status === "released" ? "bg-success" : "bg-warning",
                )}
              />
              {t(`status.${status}`)} · {t("status.version", { n: version })}
            </span>
          )}
          {readOnly && initial.assessmentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePdf}
              disabled={isPending}
            >
              <Icon name="pdf-01-stroke-rounded" size={16} />
              {t("actions.downloadPdf")}
            </Button>
          )}
          {readOnly && canWrite && (
            <Button size="sm" onClick={handleRevise} disabled={isPending}>
              <Icon name="Edit" size={16} />
              {t("actions.revise")}
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="rounded-md bg-muted px-4 py-3 text-p3 text-muted-foreground">
          {t("readOnlyNote")}
        </p>
      )}

      {/* Context (Art 13(3)) */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card-sm">
        <h3 className="text-h4 text-foreground">{t("context.heading")}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              "intendedPurpose",
              "operationalEnvironment",
              "assetsToProtect",
              "expectedLifetime",
            ] as const
          ).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>
                {t(`context.${key}`)}
                {t.has(`context.tooltips.${key}.body`) && (
                  <FieldHelp
                    title={t(`context.tooltips.${key}.title`)}
                    body={t(`context.tooltips.${key}.body`)}
                    reference={
                      t.has(`context.tooltips.${key}.ref`)
                        ? t(`context.tooltips.${key}.ref`)
                        : undefined
                    }
                    academyLessonId="risk-assessment-fundamentals"
                  />
                )}
              </Label>
              <Textarea
                id={key}
                rows={3}
                disabled={!editable}
                value={context[key]}
                onChange={(e) =>
                  setContext((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={t(`context.placeholders.${key}`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Annex I mapping */}
      <RequirementSection
        heading={t("parts.part_i")}
        description={t("parts.part_iDescription")}
        items={partI}
        editable={editable}
        t={t}
        tReq={tReq}
        levelLabel={levelLabel}
        updateItem={updateItem}
      />
      <RequirementSection
        heading={t("parts.part_ii")}
        description={t("parts.part_iiDescription")}
        items={partII}
        editable={editable}
        t={t}
        tReq={tReq}
        levelLabel={levelLabel}
        updateItem={updateItem}
      />

      {/* Version history */}
      {initial.history.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-h4 text-foreground">{t("history.heading")}</h3>
          <div className="space-y-2">
            {initial.history.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card-sm"
              >
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-success">
                  {t("status.version", { n: v.version })}
                </span>
                <span className="flex-1 text-p3 text-muted-foreground">
                  {v.released_at
                    ? t("history.released", {
                        date: new Date(v.released_at).toLocaleDateString(),
                      })
                    : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = v.has_pdf
                        ? await downloadVersionPdf(v.id)
                        : await generateVersionPdf(productId, v.id);
                      if (res.url)
                        window.open(res.url, "_blank", "noopener,noreferrer");
                    })
                  }
                >
                  <Icon name="pdf-01-stroke-rounded" size={16} />
                  {t("actions.downloadPdf")}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feedback */}
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

      {/* Sticky action bar (editable only) */}
      {editable && (
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-background/85 px-1 py-3 backdrop-blur-sm">
          <span className="text-p3 text-muted-foreground">
            {t("progress", { done: mappedCount, total: items.length })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
            <Button size="sm" onClick={handleRelease} disabled={isPending}>
              <Icon name="checkmark-badge-01-stroke-rounded" size={16} />
              {t("actions.release")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One Annex I part (I or II)
// ---------------------------------------------------------------------------

function RequirementSection({
  heading,
  description,
  items,
  editable,
  t,
  tReq,
  levelLabel,
  updateItem,
}: {
  heading: string;
  description: string;
  items: RaItem[];
  editable: boolean;
  t: ReturnType<typeof useTranslations>;
  tReq: ReturnType<typeof useTranslations>;
  levelLabel: (v: string) => string;
  updateItem: (id: string, patch: Partial<RaItem>) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-h4 text-foreground">{heading}</h3>
        <p className="mt-0.5 text-p3 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <RequirementRow
            key={it.requirementId}
            item={it}
            editable={editable}
            t={t}
            tReq={tReq}
            levelLabel={levelLabel}
            updateItem={updateItem}
          />
        ))}
      </div>
    </section>
  );
}

function RequirementRow({
  item,
  editable,
  t,
  tReq,
  levelLabel,
  updateItem,
}: {
  item: RaItem;
  editable: boolean;
  t: ReturnType<typeof useTranslations>;
  tReq: ReturnType<typeof useTranslations>;
  levelLabel: (v: string) => string;
  updateItem: (id: string, patch: Partial<RaItem>) => void;
}) {
  const band =
    item.likelihood && item.impact
      ? inherentRisk(item.likelihood, item.impact)
      : null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-card-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-l5 text-foreground">
            {tReq(`requirements.${item.requirementId}.title`)}
          </p>
          <p className="text-p4 text-muted-foreground">{item.article}</p>
        </div>
        {/* Applies / N-A segmented control */}
        <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
          {(["applies", "not_applicable"] as const).map((a) => (
            <button
              key={a}
              type="button"
              disabled={!editable}
              onClick={() => updateItem(item.requirementId, { applicability: a })}
              className={cn(
                "px-3 py-1.5 text-l6 transition-colors disabled:cursor-not-allowed",
                item.applicability === a
                  ? a === "applies"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground text-card"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`applicability.${a}`)}
            </button>
          ))}
        </div>
      </div>

      {item.applicability === "applies" && (
        <div className="mt-4 space-y-4">
          <Field label={t("item.threat")}>
            <Textarea
              rows={2}
              disabled={!editable}
              value={item.threat}
              onChange={(e) =>
                updateItem(item.requirementId, { threat: e.target.value })
              }
              placeholder={t("item.threatPlaceholder")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("item.likelihood")}>
              <select
                className={SELECT_CLASS}
                disabled={!editable}
                value={item.likelihood ?? ""}
                onChange={(e) =>
                  updateItem(item.requirementId, {
                    likelihood: (e.target.value || null) as RaItem["likelihood"],
                  })
                }
              >
                <option value="">{"—"}</option>
                {LIKELIHOOD_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {levelLabel(l)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("item.impact")}>
              <select
                className={SELECT_CLASS}
                disabled={!editable}
                value={item.impact ?? ""}
                onChange={(e) =>
                  updateItem(item.requirementId, {
                    impact: (e.target.value || null) as RaItem["impact"],
                  })
                }
              >
                <option value="">{"—"}</option>
                {IMPACT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {levelLabel(l)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("item.inherentRisk")}>
              <div className="flex h-10 items-center">
                {band ? (
                  <RiskPill band={band} label={levelLabel(band)} />
                ) : (
                  <span className="text-p4 text-muted-foreground">
                    {"—"}
                  </span>
                )}
              </div>
            </Field>
          </div>

          <Field label={t("item.implementation")}>
            <Textarea
              rows={3}
              disabled={!editable}
              value={item.implementation}
              onChange={(e) =>
                updateItem(item.requirementId, {
                  implementation: e.target.value,
                })
              }
              placeholder={t("item.implementationPlaceholder")}
            />
          </Field>

          <Field label={t("item.residualRisk")}>
            <select
              className={cn(SELECT_CLASS, "sm:max-w-xs")}
              disabled={!editable}
              value={item.residualRisk ?? ""}
              onChange={(e) =>
                updateItem(item.requirementId, {
                  residualRisk: (e.target.value || null) as RaItem["residualRisk"],
                })
              }
            >
              <option value="">{"—"}</option>
              {RESIDUAL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {item.applicability === "not_applicable" && (
        <div className="mt-4">
          <Field label={t("item.justification")}>
            <Textarea
              rows={2}
              disabled={!editable}
              value={item.justification}
              onChange={(e) =>
                updateItem(item.requirementId, {
                  justification: e.target.value,
                })
              }
              placeholder={t("item.justificationPlaceholder")}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
