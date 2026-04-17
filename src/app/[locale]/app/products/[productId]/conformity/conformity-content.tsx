"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HugeIcon } from "@/components/huge-icon";
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
  pending: "#6B7280",
  in_progress: "#D97706",
  complete: "#16A34A",
  not_applicable: "#6B7280",
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
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {t("header.routeLabel")}
              </p>
              <h2 className="mt-1 font-heading text-xl font-bold">
                {tRoute(`${state.route}.title`)}
              </h2>
              <p className="mt-2 max-w-xl text-xs text-muted-foreground/80">
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
            className="rounded-2xl border border-white/[0.06] bg-card p-6"
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold">{t("notifiedBody.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("notifiedBody.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <BodyField
                label={t("notifiedBody.name")}
                value={state.notifiedBody.name ?? ""}
                disabled={!canWrite}
                onSave={(v) => saveBody({ name: v || null })}
              />
              <BodyField
                label={t("notifiedBody.id")}
                value={state.notifiedBody.id ?? ""}
                placeholder="1234"
                disabled={!canWrite}
                onSave={(v) => saveBody({ id: v || null })}
              />
              <BodyField
                label={t("notifiedBody.scope")}
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
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
        >
          <div className="border-b border-white/[0.06] px-5 py-3">
            <span className="text-sm font-semibold">{t("steps.title")}</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
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
                    className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
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
                        <HugeIcon
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
                      <span className="block text-sm font-medium text-foreground">
                        {tStep(`${step.key}.title`)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/60">
                        {tStep(`${step.key}.description`)}
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                    >
                      {tStatus(step.status)}
                    </span>
                    <HugeIcon
                      name="arrow-right-01-stroke-rounded"
                      size={14}
                      className={cn(
                        "text-muted-foreground/40 transition-transform",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded && canWrite && (
                    <div className="border-t border-white/[0.04] bg-white/[0.015] px-5 py-5">
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
                              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                              step.status === st
                                ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                                : "border-border text-muted-foreground hover:text-foreground",
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

        {/* DoC gate + CTA — same gradient language as the onboarding/profile
            banners so the flagship "issue the declaration" action pops as the
            hero moment of the page. Text flips to white on the dark gradient
            and the primary CTA uses a white pill for maximum contrast. */}
        <div
          data-reveal
          className="overflow-hidden rounded-2xl bg-cover bg-center"
          style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 p-6 md:p-8">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    allStepsComplete
                      ? "bg-[#16A34A]"
                      : "animate-pulse bg-[#F59E0B]",
                  )}
                />
                {t("doc.eyebrow")}
              </div>
              <h2 className="font-heading text-xl font-bold leading-snug text-white md:text-2xl">
                {t("doc.title")}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/75">
                {t("doc.description")}
              </p>
              {state.declarationIssuedAt && state.declarationVersion && (
                <p className="mt-3 font-mono text-[11px] text-white/60">
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
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <HugeIcon name="pdf-01-stroke-rounded" size={14} />
                  {t("doc.download")}
                </button>
              )}
              {canIssue && (
                <button
                  type="button"
                  onClick={handleIssue}
                  disabled={!allStepsComplete || issuing}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <HugeIcon
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
  const color = value >= 100 ? "#16A34A" : value >= 50 ? "#D97706" : "#2563EB";
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
            className="text-lg font-bold tabular-nums"
            style={{ color }}
          >
            {value}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
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
  const color = ok ? "#16A34A" : "#D97706";
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ borderColor: `${color}33` }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p
        className="mt-1 flex items-center gap-1.5 text-sm font-semibold"
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
  value,
  placeholder,
  disabled,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground/70">
        {label}
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
      <label className="text-xs font-medium text-muted-foreground/70">
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
