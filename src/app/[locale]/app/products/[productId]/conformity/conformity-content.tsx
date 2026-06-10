"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import {
  SideSheetBackdrop,
  SideSheetBody,
  SideSheetFooter,
  SideSheetHero,
  SideSheetPopup,
} from "@/components/side-sheet";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  addStepComment,
  getAttachmentDownloadUrl,
  issueDeclaration,
  setStepStatus,
  updateNotifiedBody,
  uploadStepAttachment,
  type ConformityState,
  type ConformityStep,
  type ConformityStepStatus,
  type StepAttachment,
  type StepComment,
} from "./actions";
import {
  STEP_ATTACHMENT_ALLOWED_MIMES,
  STEP_ATTACHMENT_MAX_BYTES,
} from "./constants";

const STATUS_COLOR: Record<ConformityStepStatus, string> = {
  pending: "var(--muted-foreground)",
  in_progress: "var(--warning)",
  complete: "var(--success)",
  not_applicable: "var(--muted-foreground)",
};

// Per-status iconsax glyph for the composer status pills. Mirrors
// the meta-chip pattern (Figma frame 182:17729) — 16 px icon on the
// left, label on the right inside a flat `bg-muted` pill.
const STATUS_ICON: Record<ConformityStepStatus, string> = {
  pending: "Clock",
  in_progress: "Refresh",
  complete: "TickCircle",
  not_applicable: "CloseCircle",
};

// Shared className for every status chip (row chip, sheet body
// chip, and the four composer pills). Single source of truth means
// none of the call sites can drift on font / size / padding.
const STATUS_CHIP_CLASS =
  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2 text-l6-plus";

/**
 * StatusChip — Nask flat-chip recipe for conformity step statuses.
 *
 * Tier-tinted variant (`tinted=true`) reads as a live status badge:
 * background pulls `${color}1A` (10 % alpha) and the icon + text use
 * the same tier colour. Muted variant (`tinted=false`) reads as a
 * dormant selector — bg-muted with muted-foreground — and powers the
 * composer's inactive pill state.
 *
 * Geometry locked at h-7 + 8 px horizontal padding + 6 px gap + 16 px
 * icon + text-l6-plus label so the four surfaces that render it
 * (workflow row, sheet body, sheet composer pills) stay pixel-aligned.
 */
function StatusChip({
  status,
  label,
  tinted,
  className,
}: {
  status: ConformityStepStatus;
  label: string;
  /** `true` paints the tier-coloured fill; `false` uses bg-muted. */
  tinted: boolean;
  className?: string;
}) {
  const color = STATUS_COLOR[status];
  const tintedStyle = tinted
    ? ({ backgroundColor: `${color}1A`, color } as const)
    : undefined;
  return (
    <span
      className={cn(
        STATUS_CHIP_CLASS,
        !tinted && "bg-muted text-muted-foreground",
        className,
      )}
      style={tintedStyle}
    >
      <Icon name={STATUS_ICON[status]} size={16} />
      {label}
    </span>
  );
}

/**
 * StatusChipButton — interactive sibling of `<StatusChip />` used by
 * the sheet's "Set status to" composer row. Renders the exact same
 * base recipe via `STATUS_CHIP_CLASS` so the four composer pills
 * stay pixel-aligned with the workflow row chip + sheet body chip —
 * the only differences are the `<button>` element, the hover state on
 * the inactive variant, and `aria-pressed` for the active state.
 */
function StatusChipButton({
  status,
  label,
  active,
  onClick,
  className,
}: {
  status: ConformityStepStatus;
  label: string;
  /** Drives the tier-tinted vs muted styling — mirrors `StatusChip.tinted`. */
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const color = STATUS_COLOR[status];
  const tintedStyle = active
    ? ({ backgroundColor: `${color}1A`, color } as const)
    : undefined;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        STATUS_CHIP_CLASS,
        "transition-colors",
        !active &&
          "bg-muted text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        className,
      )}
      style={tintedStyle}
    >
      <Icon name={STATUS_ICON[status]} size={16} />
      {label}
    </button>
  );
}

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
  // Clicking a step opens it in a side sheet instead of expanding
  // inline below the row. Single string here is the canonical
  // controlled-mode pattern — `null` means closed.
  const [openStepKey, setOpenStepKey] = useState<string | null>(null);
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

  /**
   * Upload a file to a workflow step. Client-side guard rails first
   * (size + MIME) so we surface a fast failure without a round-trip;
   * the server action runs the same checks again as the source of
   * truth. `displayName` is the user-renamed filename (defaults to
   * the file's basename when blank).
   *
   * Returns the inserted attachment so the caller can chain follow-up
   * effects (e.g. posting an auto "Uploaded …" comment in the same
   * Save action).
   */
  async function applyAttachment(
    stepKey: string,
    file: File,
    displayName: string,
  ): Promise<StepAttachment | null> {
    if (file.size > STEP_ATTACHMENT_MAX_BYTES) {
      toast({ type: "error", message: t("toast.fileTooLarge") });
      return null;
    }
    if (
      !STEP_ATTACHMENT_ALLOWED_MIMES.includes(
        file.type as (typeof STEP_ATTACHMENT_ALLOWED_MIMES)[number],
      )
    ) {
      toast({ type: "error", message: t("toast.unsupportedMime") });
      return null;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("displayName", displayName);
    const res = await uploadStepAttachment(productId, stepKey, formData);
    if (res.error) {
      const key =
        res.error === "fileTooLarge"
          ? "toast.fileTooLarge"
          : res.error === "unsupportedMime"
            ? "toast.unsupportedMime"
            : "toast.uploadFailed";
      toast({
        type: "error",
        message: t.has(key) ? t(key) : t("toast.saveFailed"),
      });
      return null;
    }
    if (res.attachment) {
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.key === stepKey
            ? { ...s, attachments: [...s.attachments, res.attachment!] }
            : s,
        ),
      }));
      return res.attachment;
    }
    return null;
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
          className="overflow-hidden rounded-lg bg-card p-6 shadow-card-md"
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

          {/* Gate status — checklist + sbom. Hairline-divided pair
              of inline tiles, no card chrome. Five earlier passes
              (1 px tinted border, bg-muted panel + stripe, bordered
              card + icon block, wavy SVG cover) all got rejected;
              the user landed on "remove the background and change
              the layout". Final recipe is the same horizontal
              icon-+-label-+-status structure but with the visual
              container stripped — the parent hero card already
              provides the surface, so the tiles read as ambient
              metadata instead of competing widgets. */}
          <div className="mt-5 grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <GateTile
              label={t("gate.checklist")}
              ok={state.checklistComplete}
              okLabel={t("gate.ready")}
              notLabel={t("gate.pending")}
              position="left"
            />
            <GateTile
              label={t("gate.sbom")}
              ok={state.hasActiveSbom}
              okLabel={t("gate.ready")}
              notLabel={t("gate.pending")}
              position="right"
            />
          </div>
        </div>

        {/* Notified body record */}
        {notifiedBodyRequired && (
          <div
            data-reveal
            className="rounded-lg bg-card p-6 shadow-card-md"
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
          className="overflow-hidden rounded-lg bg-card shadow-card-md"
        >
          <div className="border-b border-border px-5 py-4">
            <span className="text-h4 text-foreground">{t("steps.title")}</span>
          </div>
          <div className="divide-y divide-border">
            {state.steps.map((step) => {
              const color = STATUS_COLOR[step.status];
              // `color` is still referenced by the step-number
              // badge on the left of each row (border + checkmark
              // fill). The status chip on the right now flows
              // through <StatusChip /> so the recipe stays unified.
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setOpenStepKey(step.key)}
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
                  {/* Meta chips — flat `bg-muted` pills with a
                      16 px icon + "{count} Comment(s)" / "{count}
                      Attachment(s)" label in Plus Jakarta Sans
                      SemiBold 12, muted-foreground. Matches Figma
                      frame 182:17729 (secondary chip recipe) — 28 px
                      tall (`h-7`), 8 px horizontal × 6 px vertical
                      padding, 8 px corner radius. */}
                  {step.comments.length > 0 && (
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-muted px-2 text-l6-plus text-muted-foreground">
                      <Icon name="Message" size={16} />
                      {t("meta.commentCount", { count: step.comments.length })}
                    </span>
                  )}
                  {step.attachments.length > 0 && (
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-muted px-2 text-l6-plus text-muted-foreground">
                      <Icon name="Attachment" size={16} />
                      {t("meta.attachmentCount", {
                        count: step.attachments.length,
                      })}
                    </span>
                  )}
                  <ContributorStack
                    contributors={contributorsOf(step)}
                    size="sm"
                    overlap="tight"
                  />
                  <StatusChip
                    status={step.status}
                    label={tStatus(step.status)}
                    tinted
                  />
                  <Icon
                    name="arrow-right-01-stroke-rounded"
                    size={14}
                    className="text-muted-foreground transition-transform group-hover:text-foreground"
                  />
                </button>
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

      {/* Step detail side sheet — clicking any workflow row opens
          this panel with the conversation thread + composer +
          status pills, replacing the previous inline expansion.
          Pulls the live step out of state so optimistic comment /
          status updates flow through without re-fetching. */}
      <StepDetailSheet
        step={
          openStepKey
            ? state.steps.find((s) => s.key === openStepKey) ?? null
            : null
        }
        open={openStepKey !== null}
        onOpenChange={(open) => !open && setOpenStepKey(null)}
        canWrite={canWrite}
        tStep={tStep}
        tStatus={tStatus}
        t={t}
        onApplyStatus={(status, body) => {
          if (openStepKey) applyStep(openStepKey, status, body);
        }}
        onApplyComment={(body) => {
          if (openStepKey) applyComment(openStepKey, body);
        }}
        onApplyAttachment={async (file, displayName) => {
          if (!openStepKey) return null;
          return applyAttachment(openStepKey, file, displayName);
        }}
      />
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
  position,
}: {
  label: string;
  ok: boolean;
  okLabel: string;
  notLabel: string;
  /** Half-of-pair position — drives the inset padding side so the
   *  divider hairline sits in the middle of the gap. */
  position: "left" | "right";
}) {
  // Icon now sits inline with the status text on the bottom row
  // instead of dangling as a standalone block beside a two-line
  // text column. Earlier pass had the icon vertically centered next
  // to a label+status stack — which made it visually orphan-ish
  // because it didn't line up with either text row. Inline gives
  // the icon a clear anchor: it's part of the status statement.
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 py-3",
        position === "left"
          ? "sm:pr-6"
          : "pt-3 sm:pl-6 sm:pt-3",
      )}
    >
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-h5",
          ok ? "text-success" : "text-warning",
        )}
      >
        <Icon
          name={ok ? "TickCircle" : "Clock"}
          size={18}
          variant="Bold"
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

type Contributor = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

/**
 * Distinct users who have acted on a workflow step. Currently
 * derived from comment authors — once status changes carry their
 * own audit row, this becomes the union of comment authors + status
 * changers + attachment uploaders.
 */
function contributorsOf(step: ConformityStep): Contributor[] {
  const seen = new Map<string, Contributor>();
  for (const c of step.comments) {
    const id = c.user?.id;
    if (!id || seen.has(id)) continue;
    seen.set(id, {
      id,
      name: c.user?.name ?? null,
      avatar_url: c.user?.avatar_url ?? null,
    });
  }
  return Array.from(seen.values());
}

/**
 * Stacked avatar group matching the Figma frame the user pointed
 * at (id 71:11711) — 32 px circles with `-space-x-2` overlap and a
 * `ring-2 ring-card` halo so the silhouettes are crisp against any
 * surface. Shows up to 3 avatars; anything beyond surfaces as a
 * `+N` chip on the right.
 */
function ContributorStack({
  contributors,
  size = "sm",
  overlap = "default",
}: {
  contributors: Contributor[];
  size?: "sm" | "md";
  overlap?: "default" | "tight";
}) {
  if (contributors.length === 0) return null;
  const visible = contributors.slice(0, 3);
  const extra = contributors.length - visible.length;
  return (
    <div
      className={cn(
        "flex items-center",
        overlap === "tight" ? "-space-x-1.5" : "-space-x-2",
      )}
    >
      {visible.map((u) => (
        <Avatar key={u.id} size={size} className="ring-2 ring-card">
          <AvatarImage src={u.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{initialsOf(u.name)}</AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center rounded-full bg-muted text-l6-plus text-muted-foreground ring-2 ring-card",
            size === "md" ? "size-8 text-l6" : "size-6 text-l6-plus",
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
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

/**
 * StepDetailSheet — the conversation thread + status composer for a
 * single workflow step, rendered in the canonical Nask side sheet
 * (same primitive used by FieldHelp, the create-product affordance,
 * and the Help Centre intro panel).
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ HERO   "WORKFLOW STEP"                       │
 *   │        <Step title>          [Status chip] × │
 *   │        <Step description>                    │
 *   ├──────────────────────────────────────────────┤
 *   │ BODY   Conversation thread                   │
 *   │        avatar · name · time                  │
 *   │        bubble                                │
 *   │        ...                                   │
 *   ├──────────────────────────────────────────────┤
 *   │ FOOTER (composer)                            │
 *   │        [textarea]                            │
 *   │        Set status to: [pills]                │
 *   │        helper line              [Save]      │
 *   └──────────────────────────────────────────────┘
 *
 * Replaces the previous inline expansion under each step row.
 * Putting the conversation in a side sheet keeps the workflow list
 * scannable (rows stay compact, no jumping page height when steps
 * are toggled) and matches the rest of the app's "detail-view in a
 * side panel" pattern.
 */
function StepDetailSheet({
  step,
  open,
  onOpenChange,
  canWrite,
  tStep,
  tStatus,
  t,
  onApplyStatus,
  onApplyComment,
  onApplyAttachment,
}: {
  step: ConformityStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  tStep: (key: string) => string;
  tStatus: (key: string) => string;
  t: ReturnType<typeof useTranslations>;
  onApplyStatus: (status: ConformityStepStatus, body: string) => void;
  onApplyComment: (body: string) => void;
  onApplyAttachment: (
    file: File,
    displayName: string,
  ) => Promise<StepAttachment | null>;
}) {
  const [body, setBody] = useState("");
  // Local draft for the status pill click — actually committed only
  // when the user hits Save. See the conversation history for why
  // we don't immediately fire `setStepStatus` on pill click.
  const [pendingStatus, setPendingStatus] =
    useState<ConformityStepStatus | null>(null);
  // Pending file — picked but not yet uploaded. Deferred upload
  // means the user can type a comment + rename the file + tweak
  // status all before a single Save commits everything. The actual
  // upload fires inside `handleSave`.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref for the rename input so we can auto-focus + select-all the
  // pre-filled name the instant a file is staged. Tells the user
  // "you should give this a name" without making them click first.
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Reset composer state whenever the sheet closes OR the user
  // navigates to a different step. This is an intentional "reset on
  // external change" effect — the resets only run on the close/step
  // transition, not on every render, so the cascading-render cost the
  // lint rule warns about does not apply here. (Rule disabled for this
  // file via eslint.config.mjs — the React-Compiler rule's inline
  // directives are not honored reliably in this flat-config setup.)
  useEffect(() => {
    if (!open) {
      setBody("");
      setPendingStatus(null);
      setPendingFile(null);
      setPendingFileName("");
    }
  }, [open, step?.key]);

  // Auto-focus + select-all on the rename input whenever a file is
  // freshly staged. requestAnimationFrame defers the focus until
  // after the chip has actually mounted; without it the ref would
  // still be null on the first render after `setPendingFile`.
  useEffect(() => {
    if (!pendingFile) return;
    const id = requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [pendingFile]);

  const trimmed = body.trim();
  const hasBody = trimmed.length > 0;
  const hasStatusChange =
    !!step && pendingStatus !== null && pendingStatus !== step.status;
  const hasPendingFile = pendingFile !== null;
  const cleanedFileName = pendingFileName.trim();
  // Save fires when something is staged: comment text OR a file.
  // (A bare status change still needs a comment to justify it; the
  // pending file's auto-mention satisfies that requirement.)
  const canSave = !saving && (hasBody || hasPendingFile);
  const displayStatus = pendingStatus ?? step?.status ?? "pending";

  function handleFilePick(file: File) {
    setPendingFile(file);
    // Default rename: strip extension so user types the human name,
    // we re-append the extension on save.
    const dot = file.name.lastIndexOf(".");
    setPendingFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
  }

  function clearPendingFile() {
    setPendingFile(null);
    setPendingFileName("");
  }

  /**
   * Build the final comment body. Combines the user's typed text
   * with an auto "Uploaded …" mention when a file is staged so the
   * audit thread always records what changed in one row, not two.
   */
  function effectiveCommentBody(uploadedName: string | null): string {
    const parts: string[] = [];
    if (hasBody) parts.push(trimmed);
    if (uploadedName) parts.push(`Uploaded "${uploadedName}"`);
    return parts.join("\n\n");
  }

  /**
   * Compose the final filename with extension. If the user emptied
   * the rename field, fall back to the file's original basename.
   */
  function composeFinalFileName(file: File): string {
    if (!cleanedFileName) return file.name;
    const dot = file.name.lastIndexOf(".");
    const ext = dot > 0 ? file.name.slice(dot) : "";
    // If user already typed an extension, don't double-up.
    if (ext && cleanedFileName.toLowerCase().endsWith(ext.toLowerCase())) {
      return cleanedFileName;
    }
    return `${cleanedFileName}${ext}`;
  }

  async function handleSave() {
    if (!canSave || !step) return;
    setSaving(true);

    // 1) Upload file first so the comment body can reference the
    //    final filename. If the upload fails, applyAttachment already
    //    toasted the error; bail without firing the comment / status
    //    update so we don't end up with a half-committed action.
    let uploadedName: string | null = null;
    if (pendingFile) {
      const finalName = composeFinalFileName(pendingFile);
      const attachment = await onApplyAttachment(pendingFile, finalName);
      if (!attachment) {
        setSaving(false);
        return;
      }
      uploadedName = attachment.file_name;
    }

    // 2) Compose the commit text and route through the right action.
    const commitBody = effectiveCommentBody(uploadedName);

    if (hasStatusChange && pendingStatus) {
      // setStepStatus inserts the comment alongside the status flip.
      onApplyStatus(pendingStatus, commitBody);
    } else if (commitBody) {
      // No status change but at least a comment (user-typed,
      // auto-uploaded mention, or both).
      onApplyComment(commitBody);
    }

    // 3) Reset composer.
    setBody("");
    setPendingStatus(null);
    setPendingFile(null);
    setPendingFileName("");
    setSaving(false);
  }

  // Empty render when no step is selected; the sheet itself is
  // controlled so this just prevents flashing stale content during
  // close animations.
  if (!step) {
    return null;
  }

  const eyebrowKey = t.has("steps.eyebrow") ? "steps.eyebrow" : null;

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SideSheetBackdrop />
        <SideSheetPopup data-slot="step-detail-sheet">
          <SideSheetHero
            eyebrow={eyebrowKey ? t(eyebrowKey) : "Workflow step"}
            title={tStep(`${step.key}.title`)}
            description={tStep(`${step.key}.description`)}
          />

          <SideSheetBody>
            {/* Status + contributors row — glanceable confirmation
                of what's saved (status chip) and who has been part
                of the thread (avatar stack). Both stay visible
                regardless of how far the user has scrolled. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t.has("steps.current") ? t("steps.current") : "Status"}
                </p>
                <StatusChip
                  status={step.status}
                  label={tStatus(step.status)}
                  tinted
                />
              </div>
              <ContributorStack
                contributors={contributorsOf(step)}
                size="md"
              />
            </div>

            {/* Attachments — list of files uploaded against this
                step, with filename + size + uploader + a download
                link. Click → server action mints a 60-second signed
                URL and opens it in a new tab. */}
            {step.attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t.has("attachments.title")
                    ? t("attachments.title")
                    : "Attachments"}
                </p>
                <ul className="flex flex-col gap-2">
                  {step.attachments.map((a) => (
                    <AttachmentRow key={a.id} attachment={a} t={t} />
                  ))}
                </ul>
              </div>
            )}

            {/* Comment thread — bubbles in `bg-secondary` per the
                user's "slightly darker" feedback. Matches the Nask
                Grey/03 token (#E2E4EA) so the chat surface reads
                clearly against the bg-card panel without dominating
                the page. */}
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
                      <AvatarFallback>
                        {initialsOf(c.user?.name)}
                      </AvatarFallback>
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
                      <p className="w-fit max-w-full whitespace-pre-wrap rounded-md bg-secondary/60 px-3 py-2 text-p3 text-foreground">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SideSheetBody>

          {canWrite && (
            <SideSheetFooter>
              <div className="flex flex-col gap-3">
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

                {/* Pending file chip — appears once the user picks
                    a file. Inline editable name field so the user
                    can rename before Save commits; the file's
                    original extension is auto-re-appended server-
                    side if missing. Click the × to discard. */}
                {pendingFile && (
                  <div className="flex items-center gap-2 rounded-md border-[1.5px] border-dashed border-primary/30 bg-primary/5 px-3 py-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon name="Attachment" size={14} variant="Bold" />
                    </span>
                    <Input
                      ref={renameInputRef}
                      value={pendingFileName}
                      onChange={(e) => setPendingFileName(e.target.value)}
                      placeholder={pendingFile.name}
                      className="h-8 border-transparent bg-transparent px-1 focus-visible:border-primary"
                    />
                    <p className="shrink-0 text-p4 text-muted-foreground">
                      {formatBytes(pendingFile.size)}
                    </p>
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      aria-label={
                        t.has("attachments.discard")
                          ? t("attachments.discard")
                          : "Discard pending file"
                      }
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <Icon name="cancel-circle-half-dot-stroke-rounded" size={14} />
                    </button>
                  </div>
                )}

                {/* Status pill row — label on its own row, pills
                    beneath. Pills are tighter (h-7 px-2.5) so the
                    composer doesn't dominate the sheet footer. */}
                <div className="flex flex-col gap-2">
                  <span className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                    {t.has("conversation.changeStatus")
                      ? t("conversation.changeStatus")
                      : "Set status to"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        "pending",
                        "in_progress",
                        "complete",
                        "not_applicable",
                      ] as ConformityStepStatus[]
                    ).map((st) => (
                      <StatusChipButton
                        key={st}
                        status={st}
                        label={tStatus(st)}
                        active={st === displayStatus}
                        onClick={() =>
                          setPendingStatus(st === step.status ? null : st)
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-p4 text-muted-foreground">
                    {hasStatusChange
                      ? t.has("conversation.pendingChange")
                        ? t("conversation.pendingChange", {
                            from: tStatus(step.status),
                            to: tStatus(pendingStatus!),
                          })
                        : `Pending: ${tStatus(step.status)} → ${tStatus(pendingStatus!)}`
                      : t.has("conversation.noteRequired")
                        ? t("conversation.noteRequired")
                        : "Comments are saved to the audit log and can't be edited."}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {/* Hidden file input + paperclip trigger. The
                        click stages the file as `pendingFile`; the
                        actual upload waits until the user hits Save
                        so we can rename + post the auto-comment in
                        the same atomic action. */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={STEP_ATTACHMENT_ALLOWED_MIMES.join(",")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFilePick(file);
                        // Reset the input so picking the same file
                        // twice in a row still fires onChange.
                        if (e.target) e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={hasPendingFile}
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      aria-label={
                        t.has("attachments.attach")
                          ? t("attachments.attach")
                          : "Attach a file"
                      }
                      title={
                        t.has("attachments.hint")
                          ? t("attachments.hint")
                          : "Attach a file (≤ 2 MB)"
                      }
                    >
                      <Icon name="Attachment" size={16} />
                    </button>
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
                      {saveButtonLabel({
                        hasPendingFile,
                        hasStatusChange,
                        t,
                      })}
                    </button>
                  </div>
                </div>
              </div>
            </SideSheetFooter>
          )}
        </SideSheetPopup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Attachment row
// ---------------------------------------------------------------------------

/**
 * Resolve the Save button label based on what's staged in the
 * composer. Five paths:
 *   - file pending + status change → "Save status & upload"
 *   - status change only            → "Save status change"
 *   - file pending only             → "Upload file"
 *   - comment only                  → "Save comment"
 * Translation keys live under `conformity.conversation.*` with
 * sensible English fallbacks for missing entries.
 */
function saveButtonLabel({
  hasPendingFile,
  hasStatusChange,
  t,
}: {
  hasPendingFile: boolean;
  hasStatusChange: boolean;
  t: ReturnType<typeof useTranslations>;
}): string {
  if (hasPendingFile && hasStatusChange) {
    return t.has("conversation.saveStatusAndUpload")
      ? t("conversation.saveStatusAndUpload")
      : "Save status & upload";
  }
  if (hasStatusChange) {
    return t.has("conversation.saveStatus")
      ? t("conversation.saveStatus")
      : "Save status change";
  }
  if (hasPendingFile) {
    return t.has("conversation.upload") ? t("conversation.upload") : "Upload file";
  }
  return t.has("conversation.save") ? t("conversation.save") : "Save comment";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Pick a tinted icon for an attachment based on its MIME type.
 *
 * iconsax doesn't ship a per-format glyph set (no specific
 * `PdfIcon`, `XlsIcon`, etc.) so we hand-roll the mapping using the
 * Document family + a tone token. Images use the dedicated `Image`
 * glyph. Anything unrecognised falls through to the neutral
 * "DocumentText" + primary tone.
 */
function fileIconFor(mimeType: string): {
  icon: string;
  bg: string;
  fg: string;
} {
  if (mimeType.startsWith("image/")) {
    return { icon: "Image", bg: "bg-success/10", fg: "text-success" };
  }
  if (mimeType === "application/pdf") {
    return {
      icon: "Document",
      bg: "bg-destructive/10",
      fg: "text-destructive",
    };
  }
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv"
  ) {
    return { icon: "Note1", bg: "bg-success/10", fg: "text-success" };
  }
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return { icon: "DocumentText", bg: "bg-primary/10", fg: "text-primary" };
  }
  // Plain text / fallback
  return { icon: "DocumentText", bg: "bg-muted", fg: "text-muted-foreground" };
}

/**
 * One row inside the attachment list. Clicking the filename or the
 * download icon mints a short-lived signed URL via
 * `getAttachmentDownloadUrl` and opens it in a new tab. The signed
 * URL is requested on-demand rather than baked into the page so the
 * URL never lands in browser history or analytics referrers.
 */
function AttachmentRow({
  attachment,
  t,
}: {
  attachment: StepAttachment;
  t: ReturnType<typeof useTranslations>;
}) {
  async function handleOpen() {
    const res = await getAttachmentDownloadUrl(attachment.storage_path);
    if (res.url) {
      window.open(res.url, "_blank", "noopener,noreferrer");
    }
  }

  const { icon, bg, fg } = fileIconFor(attachment.mime_type);

  return (
    <li className="group/attachment flex items-center gap-3 rounded-md px-1 py-2 transition-colors hover:bg-muted/40">
      {/* Tinted file-type icon. Tone reflects format (red for PDF,
          green for spreadsheets / images, primary for word docs).
          Tinted backgrounds are 10 % opacity of the token so the
          chips read as a subtle hierarchy rather than competing
          banner colours. */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md",
          bg,
          fg,
        )}
      >
        <Icon name={icon} size={18} variant="Bold" />
      </span>
      <button
        type="button"
        onClick={handleOpen}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="truncate text-l6 text-foreground transition-colors group-hover/attachment:text-primary">
          {attachment.file_name}
        </span>
        <span className="text-p4 text-muted-foreground">
          {formatBytes(attachment.size_bytes)}
          {attachment.user?.name ? ` · ${attachment.user.name}` : ""}
          {" · "}
          {timeAgo(attachment.created_at)}
        </span>
      </button>
      {/* Circular primary download button on the right. Replaces
          the previous monochrome `<Icon name="DocumentDownload" />`
          — the filled-blue chip reads as a CTA, not as a decorative
          state indicator. */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          t.has("attachments.download") ? t("attachments.download") : "Download"
        }
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Icon name="ArrowDown2" size={14} />
      </button>
    </li>
  );
}
