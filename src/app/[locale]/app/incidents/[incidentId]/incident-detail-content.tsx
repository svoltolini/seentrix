"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  closeIncident,
  recordUserNotification,
  submitIncidentPhase,
  updateIncident,
  type IncidentDetail,
  type IncidentPhase,
} from "../actions";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#DC2626",
  high: "#D97706",
  medium: "#2563EB",
  low: "#6B7280",
};

const PHASE_HOURS: Record<IncidentPhase, number> = {
  early_warning: 24,
  incident_report: 72,
  final_report: 14 * 24,
};

const PHASE_COLOR: Record<IncidentPhase, string> = {
  early_warning: "#DC2626",
  incident_report: "#D97706",
  final_report: "#2563EB",
};

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);
const ROLES_CAN_SUBMIT = new Set(["admin", "compliance_officer"]);

// ---------------------------------------------------------------------------
// Timer ring — circular countdown for each phase
// ---------------------------------------------------------------------------

function PhaseRing({
  phase,
  awareAt,
  submittedAt,
  label,
  subLabel,
}: {
  phase: IncidentPhase;
  awareAt: string;
  submittedAt: string | null;
  label: string;
  subLabel: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const base = new Date(awareAt).getTime();
  const windowMs = PHASE_HOURS[phase] * 3600_000;
  const deadline = base + windowMs;
  const submitted = !!submittedAt;

  const elapsed = submitted
    ? new Date(submittedAt).getTime() - base
    : now - base;
  const remaining = deadline - (submitted ? new Date(submittedAt).getTime() : now);
  const progress = Math.min(1, Math.max(0, elapsed / windowMs));
  const overdue = !submitted && remaining < 0;

  // SVG ring math
  const SIZE = 140;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const displayColor = submitted
    ? "#16A34A"
    : overdue
      ? "#DC2626"
      : remaining < 6 * 3600_000
        ? "#DC2626"
        : remaining < 24 * 3600_000
          ? "#D97706"
          : PHASE_COLOR[phase];

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
            strokeOpacity="0.2"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={displayColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {submitted ? (
            <>
              <HugeIcon
                name="checkmark-circle-01-stroke-rounded"
                size={28}
                className="text-[#16A34A]"
              />
              <span className="mt-1 text-[10px] uppercase tracking-wide text-[#16A34A]">
                {subLabel}
              </span>
            </>
          ) : (
            <>
              <span
                className="text-xl font-bold tabular-nums leading-none"
                style={{ color: displayColor }}
              >
                {formatRemaining(remaining)}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground/70">
                {overdue ? subLabel : subLabel}
              </span>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-foreground">
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/60">
        {PHASE_HOURS[phase] >= 24
          ? `${PHASE_HOURS[phase] / 24}d window`
          : `${PHASE_HOURS[phase]}h window`}
      </p>
    </div>
  );
}

function formatRemaining(ms: number): string {
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const d = Math.floor(h / 24);
  const m = Math.floor((abs / 60_000) % 60);
  if (d >= 1) return `${overdue ? "-" : ""}${d}d ${h % 24}h`;
  return `${overdue ? "-" : ""}${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Phase section
// ---------------------------------------------------------------------------

function PhaseSection({
  phase,
  label,
  description,
  submittedAt,
  initialNotes,
  prefillFromPrevious,
  canWrite,
  canSubmit,
  onSubmit,
  onSaveDraft,
  submitLabel,
  saveLabel,
  submittedLabel,
  placeholder,
}: {
  phase: IncidentPhase;
  label: string;
  description: string;
  submittedAt: string | null;
  initialNotes: string;
  prefillFromPrevious: string | null;
  canWrite: boolean;
  canSubmit: boolean;
  onSubmit: (notes: string) => Promise<void>;
  onSaveDraft: (notes: string) => Promise<void>;
  submitLabel: string;
  saveLabel: string;
  submittedLabel: string;
  placeholder: string;
}) {
  const { formatDate } = useLocaleDate();
  const [notes, setNotes] = useState(
    initialNotes || prefillFromPrevious || "",
  );
  const [, startTransition] = useTransition();

  const submitted = !!submittedAt;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-card p-5",
        submitted && "opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: PHASE_COLOR[phase] }}
            />
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
        </div>
        {submitted && (
          <span className="shrink-0 rounded-full bg-[#16A34A]/15 px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
            {submittedLabel} · {formatDate(submittedAt)}
          </span>
        )}
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={placeholder}
        disabled={!canWrite || submitted}
        className="mt-4 min-h-32"
      />

      {!submitted && canWrite && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!notes.trim()}
            onClick={() => {
              startTransition(async () => {
                await onSaveDraft(notes);
              });
            }}
          >
            {saveLabel}
          </Button>
          {canSubmit && (
            <Button
              size="sm"
              disabled={!notes.trim()}
              onClick={() => {
                startTransition(async () => {
                  await onSubmit(notes);
                });
              }}
            >
              {submitLabel}
              <HugeIcon name="arrow-right-01-stroke-rounded" size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function IncidentDetailContent({
  incident,
  currentUserRole,
}: {
  incident: IncidentDetail;
  currentUserRole: string | null;
}) {
  const t = useTranslations("incidents");
  const tType = useTranslations("incidents.type");
  const tSev = useTranslations("incidents.severity");
  const tStatus = useTranslations("incidents.status");
  const { formatDate, formatDateTime } = useLocaleDate();
  const { toast } = useToast();
  const [userNotification, setUserNotification] = useState(
    incident.user_notification_content ?? "",
  );
  const [downloading, setDownloading] = useState(false);
  const [, startTransition] = useTransition();

  const canWrite = !!currentUserRole && ROLES_CAN_WRITE.has(currentUserRole);
  const canSubmit = !!currentUserRole && ROLES_CAN_SUBMIT.has(currentUserRole);
  const isClosed = incident.status === "closed";

  const prefill = useMemo(() => {
    // Later phases get pre-filled with the previous phase's notes so users
    // don't retype everything for the next submission window.
    return {
      incident_report:
        incident.incident_report_notes ?? incident.early_warning_notes,
      final_report:
        incident.final_report_notes ??
        incident.incident_report_notes ??
        incident.early_warning_notes,
    };
  }, [incident]);

  async function handleSubmit(phase: IncidentPhase, notes: string) {
    const res = await submitIncidentPhase(incident.id, phase, notes);
    if (res.error) {
      toast({ type: "error", message: t("detail.submitFailed") });
    } else {
      toast({ type: "success", message: t("detail.submitted") });
    }
  }

  async function handleSaveDraft(
    phase: "early_warning" | "incident_report" | "final_report",
    notes: string,
  ) {
    const patch: Record<string, string | null> = {};
    if (phase === "early_warning") patch.early_warning_notes = notes || null;
    if (phase === "incident_report") patch.incident_report_notes = notes || null;
    if (phase === "final_report") patch.final_report_notes = notes || null;
    const res = await updateIncident(incident.id, patch);
    if (res.error) {
      toast({ type: "error", message: t("detail.saveFailed") });
    } else {
      toast({ type: "success", message: t("detail.saved") });
    }
  }

  async function handleNotify() {
    const res = await recordUserNotification(incident.id, userNotification);
    if (res.error) {
      toast({ type: "error", message: t("detail.notifyFailed") });
    } else {
      toast({ type: "success", message: t("detail.notified") });
    }
  }

  async function handleClose() {
    if (!confirm(t("detail.confirmClose"))) return;
    const res = await closeIncident(incident.id);
    if (res.error) {
      toast({ type: "error", message: t("detail.closeFailed") });
    } else {
      toast({ type: "success", message: t("detail.closed") });
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-${incident.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ type: "error", message: t("detail.pdfFailed") });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] pb-12">
      <StaggerReveal
        className="space-y-6"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        {/* Header */}
        <div data-reveal>
          <Link
            href="/app/incidents"
            className="text-xs font-medium text-muted-foreground/70 hover:text-foreground"
          >
            ← {t("breadcrumb")}
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{
                    backgroundColor: SEVERITY_COLOR[incident.severity],
                  }}
                >
                  {tSev(incident.severity)}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {tType(incident.type)}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {tStatus(incident.status)}
                </span>
              </div>
              <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight tracking-tight">
                {incident.title}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {t("detail.awareAt", {
                  date: formatDateTime(incident.aware_at),
                })}
              </p>
              {incident.affected_product_names.length > 0 && (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t("detail.affecting")} ·{" "}
                  <span className="text-foreground">
                    {incident.affected_product_names.join(" · ")}
                  </span>
                </p>
              )}
              {incident.linked_cve_id && (
                <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                  {incident.linked_cve_id}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <HugeIcon name="pdf-01-stroke-rounded" size={14} />
                {t("detail.downloadPdf")}
              </Button>
              {canSubmit && !isClosed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  {t("detail.close")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Timer rings */}
        {!isClosed && (
          <div
            data-reveal
            className="grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.06] bg-card p-6 sm:grid-cols-3"
          >
            <PhaseRing
              phase="early_warning"
              awareAt={incident.aware_at}
              submittedAt={incident.early_warning_submitted_at}
              label={t("phase.early_warning")}
              subLabel={
                incident.early_warning_submitted_at
                  ? t("phase.submitted")
                  : new Date(incident.aware_at).getTime() +
                        24 * 3600_000 <
                      Date.now()
                    ? t("phase.overdue")
                    : t("phase.remaining")
              }
            />
            <PhaseRing
              phase="incident_report"
              awareAt={incident.aware_at}
              submittedAt={incident.incident_report_submitted_at}
              label={t("phase.incident_report")}
              subLabel={
                incident.incident_report_submitted_at
                  ? t("phase.submitted")
                  : new Date(incident.aware_at).getTime() +
                        72 * 3600_000 <
                      Date.now()
                    ? t("phase.overdue")
                    : t("phase.remaining")
              }
            />
            <PhaseRing
              phase="final_report"
              awareAt={incident.aware_at}
              submittedAt={incident.final_report_submitted_at}
              label={t("phase.final_report")}
              subLabel={
                incident.final_report_submitted_at
                  ? t("phase.submitted")
                  : new Date(incident.aware_at).getTime() +
                        14 * 24 * 3600_000 <
                      Date.now()
                    ? t("phase.overdue")
                    : t("phase.remaining")
              }
            />
          </div>
        )}

        {/* Phase sections */}
        <div data-reveal className="space-y-4">
          <PhaseSection
            phase="early_warning"
            label={t("detail.phaseA.title")}
            description={t("detail.phaseA.description")}
            submittedAt={incident.early_warning_submitted_at}
            initialNotes={incident.early_warning_notes ?? ""}
            prefillFromPrevious={null}
            canWrite={canWrite && !isClosed}
            canSubmit={canSubmit && !isClosed}
            onSubmit={(n) => handleSubmit("early_warning", n)}
            onSaveDraft={(n) => handleSaveDraft("early_warning", n)}
            submitLabel={t("detail.phaseA.submit")}
            saveLabel={t("detail.saveDraft")}
            submittedLabel={t("phase.submitted")}
            placeholder={t("detail.phaseA.placeholder")}
          />
          <PhaseSection
            phase="incident_report"
            label={t("detail.phaseB.title")}
            description={t("detail.phaseB.description")}
            submittedAt={incident.incident_report_submitted_at}
            initialNotes={incident.incident_report_notes ?? ""}
            prefillFromPrevious={prefill.incident_report}
            canWrite={canWrite && !isClosed}
            canSubmit={canSubmit && !isClosed}
            onSubmit={(n) => handleSubmit("incident_report", n)}
            onSaveDraft={(n) => handleSaveDraft("incident_report", n)}
            submitLabel={t("detail.phaseB.submit")}
            saveLabel={t("detail.saveDraft")}
            submittedLabel={t("phase.submitted")}
            placeholder={t("detail.phaseB.placeholder")}
          />
          <PhaseSection
            phase="final_report"
            label={t("detail.phaseC.title")}
            description={t("detail.phaseC.description")}
            submittedAt={incident.final_report_submitted_at}
            initialNotes={incident.final_report_notes ?? ""}
            prefillFromPrevious={prefill.final_report}
            canWrite={canWrite && !isClosed}
            canSubmit={canSubmit && !isClosed}
            onSubmit={(n) => handleSubmit("final_report", n)}
            onSaveDraft={(n) => handleSaveDraft("final_report", n)}
            submitLabel={t("detail.phaseC.submit")}
            saveLabel={t("detail.saveDraft")}
            submittedLabel={t("phase.submitted")}
            placeholder={t("detail.phaseC.placeholder")}
          />
        </div>

        {/* User notification composer (Article 14 user notify obligation) */}
        <div
          data-reveal
          className="rounded-2xl border border-white/[0.06] bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("detail.userNotify.title")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("detail.userNotify.description")}
              </p>
            </div>
            {incident.user_notification_sent_at && (
              <span className="shrink-0 rounded-full bg-[#16A34A]/15 px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
                {t("detail.userNotify.sent", {
                  date: formatDate(incident.user_notification_sent_at),
                })}
              </span>
            )}
          </div>
          <Textarea
            value={userNotification}
            onChange={(e) => setUserNotification(e.target.value)}
            placeholder={t("detail.userNotify.placeholder")}
            disabled={!canWrite || isClosed}
            className="mt-4 min-h-24"
          />
          {canSubmit && !isClosed && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                disabled={!userNotification.trim()}
                onClick={() => startTransition(handleNotify)}
              >
                {incident.user_notification_sent_at
                  ? t("detail.userNotify.update")
                  : t("detail.userNotify.send")}
              </Button>
            </div>
          )}
        </div>
      </StaggerReveal>
    </div>
  );
}
