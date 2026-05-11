"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  addStepComment,
  issueDeclaration,
  setStepStatus,
  updateNotifiedBody,
  type ConformityState,
  type ConformityStep,
  type ConformityStepStatus,
  type StepComment,
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

  /**
   * Apply a status change. Requires a non-empty comment body — that
   * comment is appended to the step's audit-log thread alongside the
   * status update so the timeline always carries the "why" behind
   * the "what". Status flips optimistically; the comment lands
   * optimistically with a temporary id, then we swap in the real
   * server-issued id once the action returns.
   */
  async function applyStep(
    key: string,
    status: ConformityStepStatus,
    commentBody: string,
  ) {
    const trimmed = commentBody.trim();
    if (!trimmed) {
      toast({ type: "error", message: t("toast.commentRequired") });
      return;
    }
    const optimistic: StepComment = {
      id: `pending-${Math.random().toString(36).slice(2)}`,
      body: trimmed,
      created_at: new Date().toISOString(),
      user: null, // server resolves the author on the round-trip
    };
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.key === key
          ? {
              ...s,
              status,
              completed_at:
                status === "complete" ? new Date().toISOString() : null,
              comments: [...s.comments, optimistic],
            }
          : s,
      ),
    }));
    const res = await setStepStatus(productId, key, status, trimmed);
    if (res.error) {
      toast({ type: "error", message: t("toast.saveFailed") });
      return;
    }
    if (res.comment) {
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.key === key
            ? {
                ...s,
                comments: s.comments.map((c) =>
                  c.id === optimistic.id ? res.comment! : c,
                ),
              }
            : s,
        ),
      }));
    }
    toast({ type: "success", message: t("toast.saved") });
  }

  /**
   * Append a comment without changing the status. Same optimistic
   * pattern as `applyStep`.
   */
  async function applyComment(stepKey: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;
    const optimistic: StepComment = {
      id: `pending-${Math.random().toString(36).slice(2)}`,
      body: trimmed,
      created_at: new Date().toISOString(),
      user: null,
    };
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.key === stepKey
          ? { ...s, comments: [...s.comments, optimistic] }
          : s,
      ),
    }));
    const res = await addStepComment(productId, stepKey, trimmed);
    if (res.error) {
      toast({ type: "error", message: t("toast.saveFailed") });
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.key === stepKey
            ? {
                ...s,
                comments: s.comments.filter((c) => c.id !== optimistic.id),
              }
            : s,
        ),
      }));
      return;
    }
    if (res.comment) {
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.key === stepKey
            ? {
                ...s,
                comments: s.comments.map((c) =>
                  c.id === optimistic.id ? res.comment! : c,
                ),
              }
            : s,
        ),
      }));
    }
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
                  {expanded && (
                    <div className="border-t border-border bg-muted/40 px-5 py-5">
                      <StepConversation
                        step={step}
                        canWrite={canWrite}
                        tStatus={tStatus}
                        t={t}
                        onApplyStatus={(status, body) =>
                          applyStep(step.key, status, body)
                        }
                        onApplyComment={(body) =>
                          applyComment(step.key, body)
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
  // Gate tiles sit inside the conformity hero (already bg-card), so
  // they need a subtle inset look — bg-muted/40 carries it without
  // competing with the parent card's shadow. A 3 px left-edge tone
  // stripe communicates the gate state (green = ready, orange =
  // pending) consistent with the severity-bar pattern used on
  // vulnerabilities, releases, and the compliance-score hero.
  return (
    <div className="relative overflow-hidden rounded-md bg-muted/40 px-4 py-3">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          ok ? "bg-success" : "bg-warning",
        )}
      />
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-l5",
          ok ? "text-success" : "text-warning",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            ok ? "bg-success" : "bg-warning",
          )}
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

// ---------------------------------------------------------------------------
// StepConversation — the append-only audit-log thread per step
// ---------------------------------------------------------------------------
//
// Layout (per Figma frame 176:16582):
//   [comments]            chronological top → bottom
//     avatar + name + time
//     body bubble
//   [composer]
//     textarea (3 rows)
//     status pill row + "Add comment" submit
//
// A non-empty comment body is mandatory both for posting a standalone
// comment AND for changing status. Status pills are disabled until
// the composer has content; the click then atomically appends the
// comment + flips the status server-side (`setStepStatus` writes
// both rows in sequence).
//
// Read-only members (analyst / viewer) see the thread but no composer.

function initialsOf(name: string | null | undefined): string {
  const src = name?.trim() ?? "";
  if (!src) return "??";
  return src
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StepConversation({
  step,
  canWrite,
  tStatus,
  t,
  onApplyStatus,
  onApplyComment,
}: {
  step: ConformityStep;
  canWrite: boolean;
  tStatus: (key: string) => string;
  /** Full next-intl translator handle — we need `.has()` to fall back gracefully. */
  t: ReturnType<typeof useTranslations>;
  onApplyStatus: (status: ConformityStepStatus, body: string) => void;
  onApplyComment: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  // `pendingStatus` is a LOCAL draft — clicking a status pill no
  // longer fires a save. The new pill selection sits in this state
  // until the user hits the explicit Save button below. This matches
  // the user's ask: "save only when the user taps a button to save
  // instead of the add comment".
  const [pendingStatus, setPendingStatus] =
    useState<ConformityStepStatus | null>(null);

  const trimmed = body.trim();
  const hasBody = trimmed.length > 0;
  const hasStatusChange =
    pendingStatus !== null && pendingStatus !== step.status;
  // The Save button is the single commit point. It posts the comment
  // and (if a different status is pending) flips the status in the
  // same round-trip via `setStepStatus`. When no status change is
  // pending it falls through to `addStepComment` so the comment
  // posts in isolation.
  const canSave = hasBody;

  function handleSave() {
    if (!canSave) return;
    if (hasStatusChange && pendingStatus) {
      onApplyStatus(pendingStatus, trimmed);
    } else {
      onApplyComment(trimmed);
    }
    setBody("");
    setPendingStatus(null);
  }

  // The pill row reflects either the saved status or the user's
  // pending draft, so the highlight follows the click instantly even
  // though no save has fired yet.
  const displayStatus = pendingStatus ?? step.status;

  return (
    <div className="flex flex-col gap-5">
      {/* Comment thread — flat bubbles per Figma 176:16582. The
          previous render carried `shadow-card-sm` on every bubble
          which read as visual noise stacked down the page; the
          reference uses plain bg-muted slabs and lets the avatar +
          metadata carry the visual hierarchy. */}
      {step.comments.length === 0 ? (
        <p className="text-p4 text-muted-foreground">
          {t.has("conversation.empty")
            ? t("conversation.empty")
            : "No comments yet. Start the thread with the first note."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {step.comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar size="sm">
                <AvatarImage
                  src={c.user?.avatar_url ?? undefined}
                  alt=""
                />
                <AvatarFallback>{initialsOf(c.user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-l6 text-foreground">
                    {c.user?.name ??
                      (t.has("conversation.unknownUser")
                        ? t("conversation.unknownUser")
                        : "Unknown user")}
                  </p>
                  <p className="text-p4 text-muted-foreground">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
                <p className="w-fit max-w-full whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-p3 text-foreground">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Composer + status pills (write-capable members only). A
          subtle border replaces the heavier shadow-card-sm wrapper
          we had before; this section is visually lighter and the
          comment thread above is the focus. */}
      {canWrite && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              t.has("conversation.placeholder")
                ? t("conversation.placeholder")
                : "Add a note for this step…"
            }
            rows={3}
            className="resize-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-l6-plus uppercase tracking-wider text-muted-foreground">
              {t.has("conversation.changeStatus")
                ? t("conversation.changeStatus")
                : "Set status to"}
            </span>
            {(
              [
                "pending",
                "in_progress",
                "complete",
                "not_applicable",
              ] as ConformityStepStatus[]
            ).map((st) => {
              const active = st === displayStatus;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    setPendingStatus(st === step.status ? null : st)
                  }
                  className={cn(
                    "rounded-sm border-[1.5px] px-3 py-1.5 text-l6-plus transition-colors",
                    active
                      ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                      : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
                  )}
                  style={{ ["--c" as string]: STATUS_COLOR[st] }}
                >
                  {tStatus(st)}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-p4 text-muted-foreground">
              {hasStatusChange
                ? t.has("conversation.pendingChange")
                  ? // next-intl substitutes {from} / {to} via the
                    // second arg — passing the formatted strings
                    // through the translator instead of doing a
                    // post-hoc `.replace()`, which throws a
                    // FORMATTING_ERROR at runtime when next-intl
                    // sees unresolved ICU placeholders.
                    t("conversation.pendingChange", {
                      from: tStatus(step.status),
                      to: tStatus(pendingStatus!),
                    })
                  : `Pending: ${tStatus(step.status)} → ${tStatus(pendingStatus!)}`
                : t.has("conversation.noteRequired")
                  ? t("conversation.noteRequired")
                  : "Comments are saved to the audit log and can't be edited."}
            </p>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-l6 text-primary-foreground transition-colors hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Icon name="Send" size={14} />
              {hasStatusChange
                ? t.has("conversation.saveStatus")
                  ? t("conversation.saveStatus")
                  : "Save status change"
                : t.has("conversation.save")
                  ? t("conversation.save")
                  : "Save comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
