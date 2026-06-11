"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { FieldHelp } from "@/components/field-help";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createIncident,
  type IncidentPhase,
  type IncidentSeverity,
  type IncidentSummary,
  type IncidentType,
} from "./actions";
import { nextPhaseDeadline } from "@/lib/constants/incident-deadlines";

// Clay severity ramp (design handoff): critical danger-red, high amber,
// medium olive-gold, low muted — never the brand green.
const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

const STATUS_COLOR: Record<string, string> = {
  detected: "var(--destructive)",
  early_warning_submitted: "var(--warning)",
  incident_report_submitted: "var(--warning)",
  final_report_submitted: "var(--primary)",
  closed: "var(--success)",
};

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);

// ---------------------------------------------------------------------------
// Next-deadline computation — mirrors the server widget so list rows can show
// which phase is due next and how much time is left.
// ---------------------------------------------------------------------------

function nextDeadline(inc: IncidentSummary): {
  phase: IncidentPhase;
  at: Date;
} | null {
  // Trigger-aware: the final-report window is 14 days for an exploited
  // vulnerability and 1 month for a severe incident.
  return nextPhaseDeadline({
    awareAt: inc.aware_at,
    type: inc.type,
    earlySubmitted: !!inc.early_warning_submitted_at,
    notificationSubmitted: !!inc.incident_report_submitted_at,
    finalSubmitted: !!inc.final_report_submitted_at,
  });
}

function formatTimeLeft(
  target: Date,
  now: number,
): {
  text: string;
  overdue: boolean;
  hoursLeft: number;
} {
  const diff = target.getTime() - now;
  const overdue = diff <= 0;
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    return {
      text: `${days}d ${hours % 24}h`,
      overdue,
      hoursLeft: hours,
    };
  }
  const minutes = Math.floor(abs / 60000) % 60;
  return {
    text: `${hours}h ${minutes}m`,
    overdue,
    hoursLeft: hours,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function IncidentsContent({
  initialIncidents,
  products,
  currentUserRole,
}: {
  initialIncidents: IncidentSummary[];
  products: { id: string; name: string }[];
  currentUserRole: string | null;
}) {
  const t = useTranslations("incidents");
  const tType = useTranslations("incidents.type");
  const tSev = useTranslations("incidents.severity");
  const tPhase = useTranslations("incidents.phase");
  const tStatus = useTranslations("incidents.status");
  const { formatDate } = useLocaleDate();
  const { toast } = useToast();
  const [incidents] = useState(initialIncidents);
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "closed">(
    "active",
  );
  const [severityFilter, setSeverityFilter] = useState<
    Set<IncidentSeverity>
  >(new Set());
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);

  const canWrite = !!currentUserRole && ROLES_CAN_WRITE.has(currentUserRole);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (statusFilter === "active" && i.status === "closed") return false;
      if (statusFilter === "closed" && i.status !== "closed") return false;
      if (severityFilter.size > 0 && !severityFilter.has(i.severity))
        return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter]);

  const kpis = useMemo(() => {
    const active = incidents.filter((i) => i.status !== "closed");
    const overdue = active.filter((i) => {
      const next = nextDeadline(i);
      return next && next.at.getTime() < now;
    }).length;
    const critical = active.filter((i) => i.severity === "critical").length;
    return {
      active: active.length,
      overdue,
      critical,
      closed: incidents.filter((i) => i.status === "closed").length,
    };
  }, [incidents, now]);

  return (
    <div className="pb-12">
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
        <div
          data-reveal
          className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
              {t("breadcrumb")}
            </p>
            <h1 className="mt-1 text-h1">
              {t("title")}
            </h1>
            <p className="mt-1.5 max-w-xl text-p3 text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          {canWrite && (
            <Button
              size="sm"
              onClick={() => setNewIncidentOpen(true)}
              className="shrink-0"
            >
              <Icon name="plus-sign-square-stroke-rounded" size={14} />
              {t("new.cta")}
            </Button>
          )}
        </div>

        {/* KPIs */}
        <div
          data-reveal
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard
            label={t("kpi.active")}
            from="#d9a64a"
            to="#c0892e"
            accentDot
            pulse={kpis.active > 0}
          >
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-white">
              {kpis.active}
            </p>
          </StatCard>
          <StatCard
            label={t("kpi.overdue")}
            from="#c0453a"
            to="#2b2a26"
            accentDot
            pulse={kpis.overdue > 0}
          >
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-white">
              {kpis.overdue}
            </p>
          </StatCard>
          <StatCard label={t("kpi.critical")} from="#c0453a" to="#c0892e">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-white">
              {kpis.critical}
            </p>
          </StatCard>
          <StatCard label={t("kpi.closed")} from="#1f8a5b" to="#2fa56f">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-white">
              {kpis.closed}
            </p>
          </StatCard>
        </div>

        {/* Filters */}
        <div
          data-reveal
          className="flex flex-wrap items-center gap-2"
        >
          <SegmentedControl
            options={[
              { value: "active", label: t("filter.active") },
              { value: "all", label: t("filter.all") },
              { value: "closed", label: t("filter.closed") },
            ]}
            value={statusFilter}
            onChange={(v) =>
              setStatusFilter(v as "active" | "all" | "closed")
            }
          />
          <MultiSeverity
            label={t("filter.severity")}
            selected={severityFilter}
            onToggle={(s) => {
              setSeverityFilter((prev) => {
                const next = new Set(prev);
                if (next.has(s)) next.delete(s);
                else next.add(s);
                return next;
              });
            }}
            onClear={() => setSeverityFilter(new Set())}
            labels={(s) => tSev(s)}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div
            data-reveal
            className="overflow-hidden rounded-lg border border-border bg-card shadow-card-md px-6 py-20 text-center"
          >
            <div className="flex justify-center">
              <IconBadge name="alert-02" tone="warning" size="xl" />
            </div>
            <h2 className="mt-5 text-h4 text-foreground">
              {incidents.length === 0
                ? t("empty.title")
                : t("empty.filtered")}
            </h2>
            <p className="mt-2 text-p3 text-muted-foreground">
              {incidents.length === 0
                ? t("empty.description")
                : t("empty.filteredDescription")}
            </p>
            {incidents.length === 0 && (
              <div className="mt-6 flex justify-center">
                <AskSeentrixAI
                  seed="Walk me through the three Article 14 reporting phases — 24-hour early warning, 72-hour intermediate report, 14-day final report. When does each clock start?"
                  label="Explain the Article 14 reporting clocks"
                />
              </div>
            )}
          </div>
        ) : (
          <div
            data-reveal
            className="overflow-hidden rounded-md bg-muted"
          >
            <div className="flex items-center border-b border-border px-5 py-2.5 text-h6 text-muted-foreground">
              <span className="flex-1">{t("table.incident")}</span>
              <span className="hidden w-24 sm:block">{t("table.type")}</span>
              <span className="hidden w-28 sm:block">
                {t("table.aware_at")}
              </span>
              <span className="hidden w-32 md:block">{t("table.status")}</span>
              <span className="w-32 text-right">{t("table.deadline")}</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((inc) => {
                const next = nextDeadline(inc);
                const tLeft = next ? formatTimeLeft(next.at, now) : null;
                return (
                  <Link
                    key={inc.id}
                    href={`/app/incidents/${inc.id}`}
                    className="group relative flex items-center px-5 py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{
                        backgroundColor: SEVERITY_COLOR[inc.severity],
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-sm px-1.5 py-0.5 text-l6-plus uppercase tracking-wide text-white"
                          style={{
                            backgroundColor: SEVERITY_COLOR[inc.severity],
                          }}
                        >
                          {tSev(inc.severity)}
                        </span>
                        <span className="truncate text-l6 text-foreground transition-colors group-hover:text-primary">
                          {inc.title}
                        </span>
                        {inc.linked_cve_id && (
                          <span className="font-mono text-p4 text-muted-foreground">
                            · {inc.linked_cve_id}
                          </span>
                        )}
                      </div>
                      {inc.affected_product_names.length > 0 && (
                        <p className="mt-0.5 truncate text-p4 text-muted-foreground">
                          {inc.affected_product_names.join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="hidden w-24 text-p4 text-muted-foreground sm:block">
                      {tType(inc.type)}
                    </span>
                    <span className="hidden w-28 text-p4 text-muted-foreground sm:block">
                      {formatDate(inc.aware_at)}
                    </span>
                    <div className="hidden w-32 md:block">
                      <StatusChip
                        status={inc.status}
                        label={tStatus(inc.status)}
                      />
                    </div>
                    <div className="w-32 text-right">
                      {tLeft ? (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-l6",
                            tLeft.overdue
                              ? "bg-destructive/15 text-destructive"
                              : tLeft.hoursLeft < 24
                                ? "bg-warning/15 text-warning"
                                : "bg-card text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              (tLeft.overdue || tLeft.hoursLeft < 24) &&
                                "animate-pulse",
                            )}
                            style={{
                              backgroundColor: tLeft.overdue
                                ? "var(--destructive)"
                                : tLeft.hoursLeft < 24
                                  ? "var(--warning)"
                                  : "var(--muted-foreground)",
                            }}
                          />
                          {tLeft.overdue
                            ? t("deadline.overdueBy", { time: tLeft.text })
                            : t("deadline.in", { time: tLeft.text })}
                          <span className="text-p4 opacity-60">
                            · {tPhase(next!.phase)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-p4 text-muted-foreground">
                          {t("deadline.none")}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </StaggerReveal>

      <NewIncidentDialog
        open={newIncidentOpen}
        onClose={() => setNewIncidentOpen(false)}
        products={products}
        onCreated={(id) => {
          setNewIncidentOpen(false);
          toast({ type: "success", message: t("new.created") });
          window.location.href = `/app/incidents/${id}`;
        }}
        onError={() =>
          toast({ type: "error", message: t("new.error") })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-md bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-l6 transition-colors",
            value === o.value
              ? "bg-card shadow-card-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MultiSeverity({
  label,
  selected,
  onToggle,
  onClear,
  labels,
}: {
  label: string;
  selected: Set<IncidentSeverity>;
  onToggle: (s: IncidentSeverity) => void;
  onClear: () => void;
  labels: (s: IncidentSeverity) => string;
}) {
  const options: IncidentSeverity[] = ["critical", "high", "medium", "low"];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        {label}
        {selected.size > 0 && (
          <span className="ml-1 rounded-sm bg-primary/15 px-1.5 text-l6-plus tabular-nums text-primary">
            {selected.size}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((o) => (
          <DropdownMenuItem
            key={o}
            onClick={(e) => {
              e.preventDefault();
              onToggle(o);
            }}
            closeOnClick={false}
          >
            <span className="flex size-4 items-center justify-center rounded border border-border">
              {selected.has(o) && (
                <Icon
                  name="checkmark-circle-01-stroke-rounded"
                  size={12}
                  className="text-primary"
                />
              )}
            </span>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: SEVERITY_COLOR[o] }}
            />
            <span>{labels(o)}</span>
          </DropdownMenuItem>
        ))}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              <span className="text-muted-foreground">Clear</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusChip({ status, label }: { status: string; label: string }) {
  const color = STATUS_COLOR[status] ?? "var(--muted-foreground)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-l6-plus"
      style={{
        borderColor: `${color}4D`,
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// New Incident dialog
// ---------------------------------------------------------------------------

function NewIncidentDialog({
  open,
  onClose,
  products,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  products: { id: string; name: string }[];
  onCreated: (id: string) => void;
  onError: () => void;
}) {
  const t = useTranslations("incidents");
  const tType = useTranslations("incidents.type");
  const tSev = useTranslations("incidents.severity");
  const tip = (key: string) => ({
    title: t(`new.tooltips.${key}.title`),
    body: t(`new.tooltips.${key}.body`),
    reference: t(`new.tooltips.${key}.ref`),
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IncidentType>("security_incident");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={t("new.title")}
      description={t("new.description")}
      confirmLabel={t("new.create")}
      cancelLabel={t("new.cancel")}
      disabled={!title.trim()}
      onConfirm={() => {
        startTransition(async () => {
          const res = await createIncident({
            title: title.trim(),
            description: description.trim() || undefined,
            type,
            severity,
            affected_product_ids: Array.from(productIds),
          });
          if (res.error || !res.id) onError();
          else onCreated(res.id);
        });
      }}
    >
      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.titleLabel")}
            <FieldHelp {...tip("title")} />
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("new.titlePlaceholder")}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.typeLabel")}
            <FieldHelp {...tip("type")} />
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["security_incident", "exploited_vulnerability"] as const).map(
              (o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setType(o)}
                  className={cn(
                    "rounded-sm border-[1.5px] px-3 py-2 text-left text-p3 transition-colors",
                    type === o
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tType(o)}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.severityLabel")}
            <FieldHelp {...tip("severity")} />
          </label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {(["critical", "high", "medium", "low"] as IncidentSeverity[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "rounded-sm border-[1.5px] px-2 py-1.5 text-l6 transition-colors",
                    severity === s
                      ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                      : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
                  )}
                  style={{ ["--c" as string]: SEVERITY_COLOR[s] }}
                >
                  {tSev(s)}
                </button>
              ),
            )}
          </div>
        </div>
        {products.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-l6 text-muted-foreground">
              {t("new.affectedProductsLabel")}
              <FieldHelp {...tip("affectedProducts")} />
            </label>
            <div className="mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border-outline bg-card p-1">
              {products.map((p) => {
                const on = productIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(p.id)) next.delete(p.id);
                        else next.add(p.id);
                        return next;
                      });
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-p3 transition-colors",
                      on
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="flex size-4 items-center justify-center rounded border border-border">
                      {on && (
                        <Icon
                          name="checkmark-circle-01-stroke-rounded"
                          size={12}
                          className="text-primary"
                        />
                      )}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.descriptionLabel")}
            <FieldHelp {...tip("description")} />
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("new.descriptionPlaceholder")}
            className="mt-1.5 min-h-20"
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
