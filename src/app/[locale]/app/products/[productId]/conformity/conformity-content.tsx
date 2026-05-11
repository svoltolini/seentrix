"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  issueDeclaration,
  setStepStatus,
  updateNotifiedBody,
  type ConformityState,
  type ConformityStepStatus,
} from "./actions";

const STATUS_COLOR: Record<ConformityStepStatus, string> = {
  pending: "var(--muted-foreground)",
  in_progress: "var(--warning)",
  complete: "var(--success)",
  not_applicable: "var(--muted-foreground)",
};

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);
const ROLES_CAN_ISSUE = new Set(["admin", "compliance_officer"]);

export function ConformityContent({
  productId,
  initial,
  currentUserRole,
}: {
  productId: string;
  initial: ConformityState;
  currentUserRole: string | null;
}) {
  const t = useTranslations("conformity");
  const tRoute = useTranslations("conformity.route");
  const tStep = useTranslations("conformity.step");
  const tStatus = useTranslations("conformity.status");
  const { formatDate } = useLocaleDate();
  const { toast } = useToast();
  const [state, setState] = useState(initial);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [issuing, setIssuing] = useState(false);

  const canWrite = !!currentUserRole && ROLES_CAN_WRITE.has(currentUserRole);
  const canIssue = !!currentUserRole && ROLES_CAN_ISSUE.has(currentUserRole);

  const progress = useMemo(() => {
    const total = state.steps.filter(
      (s) => s.status !== "not_applicable",
    ).length;
    const done = state.steps.filter((s) => s.status === "complete").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [state.steps]);

  const allStepsComplete = useMemo(() => {
    return state.steps.every(
      (s) => s.status === "complete" || s.status === "not_applicable",
    );
  }, [state.steps]);

  const notifiedBodyRequired =
    state.requiresNotifiedBody ||
    state.route === "module_h" ||
    state.route === "module_b_c" ||
    state.route === "european_certification";

  async function applyStep(
    key: string,
    status: ConformityStepStatus,
    notes?: string,
  ) {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.key === key
          ? {
              ...s,
              status,
              notes: notes ?? s.notes,
              completed_at:
                status === "complete" ? new Date().toISOString() : null,
            }
          : s,
      ),
    }));
    const res = await setStepStatus(productId, key, status, notes);
    if (res.error) toast({ type: "error", message: t("toast.saveFailed") });
    else toast({ type: "success", message: t("toast.saved") });
  }

  async function saveBody(patch: {
    name?: string | null;
    id?: string | null;
    scope?: string | null;
  }) {
    setState((prev) => ({
      ...prev,
      notifiedBody: { ...prev.notifiedBody, ...patch },
    }));
    const res = await updateNotifiedBody(productId, patch);
    if (res.error) toast({ type: "error", message: t("toast.saveFailed") });
    else toast({ type: "success", message: t("toast.saved") });
  }

  async function handleIssue() {
    if (!allStepsComplete) return;
    setIssuing(true);
    const res = await issueDeclaration(productId);
    setIssuing(false);
    if (res.error) {
      toast({
        type: "error",
        message:
          res.error === "stepsIncomplete"
            ? t("doc.stepsIncomplete")
            : res.error === "orgProfileIncomplete"
              ? t("doc.profileIncomplete")
              : t("toast.saveFailed"),
      });
    } else if (res.version) {
      setState((prev) => ({
        ...prev,
        declarationIssuedAt: new Date().toISOString(),
        declarationVersion: res.version ?? null,
      }));
      toast({ type: "success", message: t("doc.issued") });
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/products/${productId}/doc`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `declaration-of-conformity-${state.productName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ type: "error", message: t("doc.downloadFailed") });
    }
  }

  return (
    <div>
      <StaggerReveal
        className="space-y-6"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        {/* Hero: route + progress ring */}
        <div
          data-reveal
          className="overflow-hidden rounded-md bg-card p-6 shadow-card-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                {t("header.routeLabel")}
              </p>
              <h2 className="mt-1 text-h3">
                {tRoute(`${state.route}.title`)}
              </h2>
              <p className="mt-2 max-w-xl text-p3 text-muted-foreground">
                {tRoute(`${state.route}.description`)}
              </p>
            </div>
            <ProgressRing
              value={progress}
              label={t("header.progressLabel")}
            />
          </div>

          {/* Gate status — checklist + sbom (read-only summary) */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <GateTile
              label={t("gate.checklist")}
              ok={state.checklistComplete}
              okLabel={t("gate.ready")}
              notLabel={t("gate.pending")}
            />
            <GateTile
              label={t("gate.sbom")}
              ok={state.hasActiveSbom}
              okLabel={t("gate.ready")}
              notLabel={t("gate.pending")}
            />
          </div>
        </div>

        {/* Notified body record */}
        {notifiedBodyRequired && (
          <div
            data-reveal
            className="rounded-md bg-card p-6 shadow-card-md"
          >
            <div className="mb-4">
              <h2 className="text-h4 text-foreground">{t("notifiedBody.title")}</h2>
              <p className="mt-1 text-p3 text-muted-foreground">
                {t("notifiedBody.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <BodyField
                label={t("notifiedBody.name")}
                help={
                  <FieldHelp
                    title={t("notifiedBody.tooltips.name.title")}
                    body={t("notifiedBody.tooltips.name.body")}
                    reference={t("notifiedBody.tooltips.name.ref")}
                  />
                }
                value={state.notifiedBody.name ?? ""}
                disabled={!canWrite}
                onSave={(v) => saveBody({ name: v || null })}
              />
              <BodyField
                label={t("notifiedBody.id")}
                help={
                  <FieldHelp
                    title={t("notifiedBody.tooltips.id.title")}
                    body={t("notifiedBody.tooltips.id.body")}
                    reference={t("notifiedBody.tooltips.id.ref")}
                  />
                }
                value={state.notifiedBody.id ?? ""}
                placeholder="1234"
                disabled={!canWrite}
                onSave={(v) => saveBody({ id: v || null })}
              />
              <BodyField
                label={t("notifiedBody.scope")}
                help={
                  <FieldHelp
                    title={t("notifiedBody.tooltips.scope.title")}
                    body={t("notifiedBody.tooltips.scope.body")}
                    reference={t("notifiedBody.tooltips.scope.ref")}
                  />
                }
                value={state.notifiedBody.scope ?? ""}
                disabled={!canWrite}
                onSave={(v) => saveBody({ scope: v || null })}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div
          data-reveal
          className="overflow-hidden rounded-md bg-card shadow-card-md"
        >
          <div className="border-b border-border px-5 py-4">
            <span className="text-h4 text-foreground">{t("steps.title")}</span>
          </div>
          <div className="divide-y divide-border">
            {state.steps.map((step) => {
              const color = STATUS_COLOR[step.status];
              const expanded = expandedKey === step.key;
              return (
                <div key={step.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKey((prev) =>
                        prev === step.key ? null : step.key,
                      )
                    }
                    className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: color,
                        backgroundColor:
                          step.status === "complete" ? color : "transparent",
                      }}
                    >
                      {step.status === "complete" && (
                        <Icon
                          name="checkmark-circle-01-stroke-rounded"
                          size={12}
                          className="text-white"
                        />
                      )}
                      {step.status === "in_progress" && (
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-l6 text-foreground">
                        {tStep(`${step.key}.title`)}
                      </span>
                      <span className="block text-p4 text-muted-foreground">
                        {tStep(`${step.key}.description`)}
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-sm px-2.5 py-0.5 text-l6-plus"
                      style={{
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                    >
                      {tStatus(step.status)}
                    </span>
                    <Icon
                      name="arrow-right-01-stroke-rounded"
                      size={14}
                      className={cn(
                        "text-muted-foreground transition-transform",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded && canWrite && (
                    <div className="border-t border-border bg-muted/40 px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            "pending",
                            "in_progress",
                            "complete",
                            "not_applicable",
                          ] as ConformityStepStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              startTransition(() => applyStep(step.key, st))
                            }
                            className={cn(
                              "rounded-sm border-[1.5px] px-3 py-1.5 text-l6-plus transition-colors",
                              step.status === st
                                ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                                : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
                            )}
                            style={{
                              ["--c" as string]: STATUS_COLOR[st],
                            }}
                          >
                            {tStatus(st)}
                          </button>
                        ))}
                      </div>
                      <StepNotes
                        stepKey={step.key}
                        initialValue={step.notes ?? ""}
                        placeholder={t("steps.notesPlaceholder")}
                        label={t("steps.notesLabel")}
                        onSave={(value) =>
                          startTransition(() =>
                            applyStep(step.key, step.status, value),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DoC gate + CTA — bg-primary + radial dot-grid overlay,
            same recipe used by the product detail hero and the
            landing TrustSection so every "primary blue panel" in the
            app reads as one family. The earlier full-bleed
            entity-role-bg.svg made this banner feel like a different
            system. */}
        <div
          data-reveal
          className="relative overflow-hidden rounded-md bg-primary"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4 p-6 md:p-8">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-sm border-[1.5px] border-primary-foreground/30 bg-primary-foreground/15 px-3 py-1 text-l6-plus uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    allStepsComplete
                      ? "bg-success"
                      : "animate-pulse bg-warning",
                  )}
                />
                {t("doc.eyebrow")}
              </div>
              <h2 className="text-h3 leading-snug text-primary-foreground">
                {t("doc.title")}
              </h2>
              <p className="mt-2 max-w-xl text-p3 text-primary-foreground/90">
                {t("doc.description")}
              </p>
              {state.declarationIssuedAt && state.declarationVersion && (
                <p className="mt-3 font-mono text-p4 text-primary-foreground/80">
                  {state.declarationVersion} ·{" "}
                  {t("doc.issuedOn", {
                    date: formatDate(state.declarationIssuedAt),
                  })}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {state.declarationIssuedAt && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-sm border-[1.5px] border-primary-foreground/30 bg-primary-foreground/15 px-4 py-2.5 text-l6 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/25"
                >
                  <Icon name="pdf-01-stroke-rounded" size={14} />
                  {t("doc.download")}
                </button>
              )}
              {canIssue && (
                <button
                  type="button"
                  onClick={handleIssue}
                  disabled={!allStepsComplete || issuing}
                  className="inline-flex items-center gap-2 rounded-sm bg-card px-4 py-2.5 text-l6 text-foreground shadow-card-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Icon
                    name="checkmark-circle-01-stroke-rounded"
                    size={14}
                  />
                  {state.declarationIssuedAt
                    ? t("doc.reissue")
                    : t("doc.issue")}
                </button>
              )}
            </div>
          </div>
        </div>
      </StaggerReveal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressRing({ value, label }: { value: number; label: string }) {
  const SIZE = 88;
  const STROKE = 8;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - value / 100);
  const color = value >= 100 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--primary)";
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeOpacity="0.25"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-h5 tabular-nums"
            style={{ color }}
          >
            {value}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-l6-plus uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function GateTile({
  label,
  ok,
  okLabel,
  notLabel,
}: {
  label: string;
  ok: boolean;
  okLabel: string;
  notLabel: string;
}) {
  const color = ok ? "var(--success)" : "var(--warning)";
  return (
    <div
      className="rounded-md border px-4 py-3"
      style={{ borderColor: `${color}33` }}
    >
      <p className="text-l6-plus uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-1 flex items-center gap-1.5 text-l6"
        style={{ color }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {ok ? okLabel : notLabel}
      </p>
    </div>
  );
}

function BodyField({
  label,
  help,
  value,
  placeholder,
  disabled,
  onSave,
}: {
  label: string;
  help?: React.ReactNode;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <div>
      <label className="flex items-center gap-2 text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
        {label}
        {help}
      </label>
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onSave(local);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1.5"
      />
    </div>
  );
}

function StepNotes({
  stepKey,
  initialValue,
  placeholder,
  label,
  onSave,
}: {
  stepKey: string;
  initialValue: string;
  placeholder: string;
  label: string;
  onSave: (value: string) => void;
}) {
  const [local, setLocal] = useState(initialValue);
  return (
    <div className="mt-3">
      <label className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
        {label}
      </label>
      <Textarea
        key={stepKey}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initialValue) onSave(local);
        }}
        placeholder={placeholder}
        className="mt-1.5 min-h-20"
      />
    </div>
  );
}
