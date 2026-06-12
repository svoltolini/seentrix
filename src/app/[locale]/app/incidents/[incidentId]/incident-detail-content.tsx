"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  closeIncident,
  generateSrpPackage,
  recordSubmissionReference,
  recordUserNotification,
  submitIncidentPhase,
  updateIncident,
  type IncidentDetail,
  type IncidentPhase,
} from "../actions";
import {
  phaseWindowHours,
  formatRemaining,
} from "@/lib/constants/incident-deadlines";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--primary)",
  low: "var(--muted-foreground)",
};

const PHASE_COLOR: Record<IncidentPhase, string> = {
  early_warning: "var(--destructive)",
  incident_report: "var(--warning)",
  final_report: "var(--primary)",
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
  type,
  awareAt,
  submittedAt,
  label,
  submittedLabel,
  overdueLabel,
  remainingLabel,
}: {
  phase: IncidentPhase;
  type: IncidentDetail["type"];
  awareAt: string;
  submittedAt: string | null;
  label: string;
  submittedLabel: string;
  overdueLabel: string;
  remainingLabel: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const base = new Date(awareAt).getTime();
  const windowHours = phaseWindowHours(phase, type);
  const windowMs = windowHours * 3600_000;
  const deadline = base + windowMs;
  const submitted = !!submittedAt;

  const elapsed = submitted
    ? new Date(submittedAt).getTime() - base
    : now - base;
  const remaining = deadline - (submitted ? new Date(submittedAt).getTime() : now);
  const progress = Math.min(1, Math.max(0, elapsed / windowMs));
  const overdue = !submitted && remaining < 0;
  const subLabel = submitted
    ? submittedLabel
    : overdue
      ? overdueLabel
      : remainingLabel;

  // SVG ring math
  const SIZE = 140;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const displayColor = submitted
    ? "var(--success)"
    : overdue
      ? "var(--destructive)"
      : remaining < 6 * 3600_000
        ? "var(--destructive)"
        : remaining < 24 * 3600_000
          ? "var(--warning)"
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
              <Icon
                name="checkmark-circle-01-stroke-rounded"
                size={28}
                className="text-success"
              />
              <span className="mt-1 text-l6-plus uppercase tracking-wide text-success">
                {subLabel}
              </span>
            </>
          ) : (
            <>
              <span
                className="text-h4 tabular-nums leading-none"
                style={{ color: displayColor }}
              >
                {formatRemaining(remaining)}
              </span>
              <span className="mt-1 text-l6-plus uppercase tracking-wide text-muted-foreground">
                {subLabel}
              </span>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-l6 text-foreground">
        {label}
      </p>
      <p className="text-p4 text-muted-foreground">
        {windowHours >= 24
          ? `${Math.round(windowHours / 24)}d window`
          : `${windowHours}h window`}
      </p>
    </div>
  );
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
        "rounded-md bg-muted p-5",
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
            <h3 className="text-h5 text-foreground">{label}</h3>
          </div>
          <p className="mt-1 text-p3 text-muted-foreground">{description}</p>
        </div>
        {submitted && (
          <span className="shrink-0 rounded-sm bg-success/15 px-2.5 py-1 text-l6-plus text-success">
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
              <Icon name="arrow-right-01-stroke-rounded" size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ENISA Single Reporting Platform — submission log + reference numbers + export
// ---------------------------------------------------------------------------

const ENISA_SRP_URL =
  "https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act";

function SrpSection({
  incident,
  canEdit,
}: {
  incident: IncidentDetail;
  canEdit: boolean;
}) {
  const t = useTranslations("incidents");
  const tType = useTranslations("incidents.type");
  const tSev = useTranslations("incidents.severity");
  const { formatDate } = useLocaleDate();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [refs, setRefs] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const sub of incident.submissions) m[sub.stage] = sub.reference_no ?? "";
    return m;
  });
  const [busyPdf, setBusyPdf] = useState<string | null>(null);

  const stages: { phase: IncidentPhase; submittedAt: string | null }[] = [
    { phase: "early_warning", submittedAt: incident.early_warning_submitted_at },
    {
      phase: "incident_report",
      submittedAt: incident.incident_report_submitted_at,
    },
    { phase: "final_report", submittedAt: incident.final_report_submitted_at },
  ];

  async function copySummary() {
    const text = [
      `${t("srp.copy.type")}: ${tType(incident.type)}`,
      `${t("srp.copy.severity")}: ${tSev(incident.severity)}`,
      `${t("srp.copy.title")}: ${incident.title}`,
      `${t("srp.copy.awareAt")}: ${incident.aware_at}`,
      `${t("srp.copy.products")}: ${incident.affected_product_names.join(", ") || "—"}`,
      incident.linked_cve_id ? `CVE: ${incident.linked_cve_id}` : "",
      "",
      `${t("srp.copy.description")}:`,
      incident.description ?? "",
    ]
      .filter((l) => l.length > 0 || l === "")
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: "success", message: t("srp.copied") });
    } catch {
      toast({ type: "error", message: t("srp.copyFailed") });
    }
  }

  function handleSaveRef(phase: IncidentPhase) {
    startTransition(async () => {
      const res = await recordSubmissionReference(
        incident.id,
        phase,
        refs[phase] ?? "",
      );
      toast(
        res.error
          ? { type: "error", message: t("srp.refFailed") }
          : { type: "success", message: t("srp.refSaved") },
      );
    });
  }

  async function handlePdf(phase: IncidentPhase) {
    setBusyPdf(phase);
    try {
      const res = await generateSrpPackage(incident.id, phase);
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else toast({ type: "error", message: t("srp.pdfFailed") });
    } finally {
      setBusyPdf(null);
    }
  }

  return (
    <div data-reveal className="rounded-md bg-muted p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-h5 text-foreground">{t("srp.title")}</h3>
          <p className="mt-1 text-p3 text-muted-foreground">
            {t("srp.description")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copySummary}>
            {t("srp.copySummary")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href={ENISA_SRP_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {t("srp.openSrp")}
            <Icon name="arrow-right-01-stroke-rounded" size={14} />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {stages.map(({ phase, submittedAt }) => (
          <div
            key={phase}
            className="flex flex-wrap items-center gap-3 rounded-lg bg-card px-4 py-3"
          >
            <span className="min-w-0 flex-1 text-p3 text-foreground">
              {t(`phase.${phase}`)}
            </span>
            {submittedAt ? (
              <>
                <span className="text-p4 text-muted-foreground">
                  {t("srp.submittedOn", { date: formatDate(submittedAt) })}
                </span>
                <Input
                  value={refs[phase] ?? ""}
                  onChange={(e) =>
                    setRefs((p) => ({ ...p, [phase]: e.target.value }))
                  }
                  placeholder={t("srp.refPlaceholder")}
                  disabled={!canEdit}
                  className="h-9 w-44"
                />
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveRef(phase)}
                  >
                    {t("srp.saveRef")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyPdf === phase}
                  onClick={() => handlePdf(phase)}
                >
                  <Icon name="pdf-01-stroke-rounded" size={14} />
                  {t("srp.package")}
                </Button>
              </>
            ) : (
              <span className="text-p4 text-muted-foreground">
                {t("srp.pending")}
              </span>
            )}
          </div>
        ))}
      </div>
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
        className="space-y-[18px]"
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
            className="text-l6 text-muted-foreground hover:text-foreground"
          >
            ← {t("breadcrumb")}
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-sm px-1.5 py-0.5 text-l6-plus uppercase tracking-wide text-white"
                  style={{
                    backgroundColor: SEVERITY_COLOR[incident.severity],
                  }}
                >
                  {tSev(incident.severity)}
                </span>
                <span className="rounded-sm bg-muted px-2 py-0.5 text-l6-plus text-muted-foreground">
                  {tType(incident.type)}
                </span>
                <span className="rounded-sm bg-muted px-2 py-0.5 text-l6-plus text-muted-foreground">
                  {tStatus(incident.status)}
                </span>
              </div>
              <h1 className="mt-2 text-h1 text-foreground">
                {incident.title}
              </h1>
              <p className="mt-2 text-p3 text-muted-foreground">
                {t("detail.awareAt", {
                  date: formatDateTime(incident.aware_at),
                })}
              </p>
              {incident.affected_product_names.length > 0 && (
                <p className="mt-1 text-p3 text-muted-foreground">
                  {t("detail.affecting")} ·{" "}
                  <span className="text-foreground">
                    {incident.affected_product_names.join(" · ")}
                  </span>
                </p>
              )}
              {incident.linked_cve_id && (
                <p className="mt-1 font-mono text-p3 text-muted-foreground">
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
                <Icon name="pdf-01-stroke-rounded" size={14} />
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

        {/* Timer rings — windows are trigger-aware (final = 14d for an
            exploited vulnerability, 1 month for a severe incident). */}
        {!isClosed && (
          <div
            data-reveal
            className="grid grid-cols-1 gap-4 rounded-md bg-muted p-6 sm:grid-cols-3"
          >
            {(
              [
                ["early_warning", incident.early_warning_submitted_at],
                ["incident_report", incident.incident_report_submitted_at],
                ["final_report", incident.final_report_submitted_at],
              ] as const
            ).map(([phase, submittedAt]) => (
              <PhaseRing
                key={phase}
                phase={phase}
                type={incident.type}
                awareAt={incident.aware_at}
                submittedAt={submittedAt}
                label={t(`phase.${phase}`)}
                submittedLabel={t("phase.submitted")}
                overdueLabel={t("phase.overdue")}
                remainingLabel={t("phase.remaining")}
              />
            ))}
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
          className="rounded-md bg-muted p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-h5 text-foreground">
                {t("detail.userNotify.title")}
              </h3>
              <p className="mt-1 text-p3 text-muted-foreground">
                {t("detail.userNotify.description")}
              </p>
            </div>
            {incident.user_notification_sent_at && (
              <span className="shrink-0 rounded-sm bg-success/15 px-2.5 py-1 text-l6-plus text-success">
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

        {/* ENISA Single Reporting Platform — submission log + export */}
        <SrpSection incident={incident} canEdit={canSubmit && !isClosed} />
      </StaggerReveal>
    </div>
  );
}
