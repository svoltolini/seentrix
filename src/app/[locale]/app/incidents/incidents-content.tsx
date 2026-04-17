"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
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

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  critical: "#DC2626",
  high: "#D97706",
  medium: "#2563EB",
  low: "#6B7280",
};

const STATUS_COLOR: Record<string, string> = {
  detected: "#DC2626",
  early_warning_submitted: "#D97706",
  incident_report_submitted: "#D97706",
  final_report_submitted: "#2563EB",
  closed: "#16A34A",
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
  const base = new Date(inc.aware_at).getTime();
  const phases: {
    phase: IncidentPhase;
    at: number;
    done: boolean;
  }[] = [
    {
      phase: "early_warning",
      at: base + 24 * 3600 * 1000,
      done: !!inc.early_warning_submitted_at,
    },
    {
      phase: "incident_report",
      at: base + 72 * 3600 * 1000,
      done: !!inc.incident_report_submitted_at,
    },
    {
      phase: "final_report",
      at: base + 14 * 24 * 3600 * 1000,
      done: !!inc.final_report_submitted_at,
    },
  ];
  for (const p of phases) {
    if (!p.done) return { phase: p.phase, at: new Date(p.at) };
  }
  return null;
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
        <div
          data-reveal
          className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {t("breadcrumb")}
            </p>
            <h1 className="mt-1 font-heading text-[28px] font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          {canWrite && (
            <Button
              size="sm"
              onClick={() => setNewIncidentOpen(true)}
              className="shrink-0"
            >
              <HugeIcon name="plus-sign-square-stroke-rounded" size={14} />
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
            from="#D97706"
            to="#EA580C"
            accentDot
            pulse={kpis.active > 0}
          >
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">
              {kpis.active}
            </p>
          </StatCard>
          <StatCard
            label={t("kpi.overdue")}
            from="#DC2626"
            to="#7F1D1D"
            accentDot
            pulse={kpis.overdue > 0}
          >
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">
              {kpis.overdue}
            </p>
          </StatCard>
          <StatCard label={t("kpi.critical")} from="#DC2626" to="#E11D48">
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">
              {kpis.critical}
            </p>
          </StatCard>
          <StatCard label={t("kpi.closed")} from="#16A34A" to="#15803D">
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">
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
            className="overflow-hidden rounded-2xl bg-cover bg-center px-6 py-20 text-center"
            style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-black/25">
              <HugeIcon name="alert-02" size={28} className="text-white/90" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              {incidents.length === 0
                ? t("empty.title")
                : t("empty.filtered")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {incidents.length === 0
                ? t("empty.description")
                : t("empty.filteredDescription")}
            </p>
          </div>
        ) : (
          <div
            data-reveal
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
          >
            <div className="flex items-center border-b border-white/[0.06] px-5 py-2.5 text-[11px] text-muted-foreground/60">
              <span className="flex-1">{t("table.incident")}</span>
              <span className="hidden w-24 sm:block">{t("table.type")}</span>
              <span className="hidden w-28 sm:block">
                {t("table.aware_at")}
              </span>
              <span className="hidden w-32 md:block">{t("table.status")}</span>
              <span className="w-32 text-right">{t("table.deadline")}</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((inc) => {
                const next = nextDeadline(inc);
                const tLeft = next ? formatTimeLeft(next.at, now) : null;
                return (
                  <Link
                    key={inc.id}
                    href={`/app/incidents/${inc.id}`}
                    className="group relative flex items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
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
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{
                            backgroundColor: SEVERITY_COLOR[inc.severity],
                          }}
                        >
                          {tSev(inc.severity)}
                        </span>
                        <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                          {inc.title}
                        </span>
                        {inc.linked_cve_id && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            · {inc.linked_cve_id}
                          </span>
                        )}
                      </div>
                      {inc.affected_product_names.length > 0 && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                          {inc.affected_product_names.join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="hidden w-24 text-xs text-muted-foreground sm:block">
                      {tType(inc.type)}
                    </span>
                    <span className="hidden w-28 text-xs text-muted-foreground sm:block">
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
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                            tLeft.overdue
                              ? "bg-[#DC2626]/15 text-[#DC2626]"
                              : tLeft.hoursLeft < 24
                                ? "bg-[#D97706]/15 text-[#D97706]"
                                : "bg-white/[0.04] text-muted-foreground",
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
                                ? "#DC2626"
                                : tLeft.hoursLeft < 24
                                  ? "#D97706"
                                  : "#6B7280",
                            }}
                          />
                          {tLeft.overdue
                            ? t("deadline.overdueBy", { time: tLeft.text })
                            : t("deadline.in", { time: tLeft.text })}
                          <span className="text-[10px] opacity-60">
                            · {tPhase(next!.phase)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">
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
    <div className="inline-flex gap-1 rounded-lg border border-white/[0.06] bg-card p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-white/[0.08] text-foreground"
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
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold tabular-nums text-primary">
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
                <HugeIcon
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
  const color = STATUS_COLOR[status] ?? "#6B7280";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
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
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.titleLabel")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("new.titlePlaceholder")}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.typeLabel")}
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["security_incident", "exploited_vulnerability"] as const).map(
              (o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setType(o)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    type === o
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tType(o)}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.severityLabel")}
          </label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {(["critical", "high", "medium", "low"] as IncidentSeverity[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                    severity === s
                      ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                      : "border-border text-muted-foreground hover:text-foreground",
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
            <label className="text-xs font-medium text-muted-foreground">
              {t("new.affectedProductsLabel")}
            </label>
            <div className="mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-1">
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
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      on
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03]",
                    )}
                  >
                    <span className="flex size-4 items-center justify-center rounded border border-border">
                      {on && (
                        <HugeIcon
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
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.descriptionLabel")}
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
