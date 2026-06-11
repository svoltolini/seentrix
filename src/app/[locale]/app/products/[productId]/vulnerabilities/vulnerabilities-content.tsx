"use client";

/**
 * Vulnerabilities content surface.
 *
 * Largest client surface in the app (~1300 lines). Owns:
 *   - The data table with bulk actions, filters, sorting, inline editing
 *   - The "actively exploited" flag flow + the resolve / mark-as-exploited
 *     confirm dialogs
 *   - The KPI strip + severity chart at the top of the page
 *
 * Data layer is server-side (`./actions.ts`); this file is purely
 * presentation + form state. Splitting the table out into its own component
 * is on the cleanup wishlist but isn't trivial because of how filters,
 * bulk-selection, and per-row inline edit all share state.
 */

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  assignVulnerability,
  bulkAssignVulnerabilities,
  bulkUpdateVulnStatus,
  setActivelyExploited,
  updateVulnerabilityStatus,
  type TeamMemberOption,
  type VulnListItem,
  type VulnResolutionType,
  type VulnSeverity,
  type VulnStatus,
} from "./actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MS_PER_DAY } from "@/lib/time";

// ---------------------------------------------------------------------------
// Colors + labels (single source of truth for severity/status visuals)
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<VulnSeverity, string> = {
  critical: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--primary)",
  low: "var(--muted-foreground)",
};

const STATUS_COLOR: Record<VulnStatus, string> = {
  open: "var(--muted-foreground)",
  in_progress: "var(--warning)",
  resolved: "var(--success)",
  accepted: "var(--primary)",
};

const STATUS_ORDER: VulnStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "accepted",
];

const SEVERITY_ORDER: VulnSeverity[] = ["critical", "high", "medium", "low"];

const RESOLUTION_TYPES: VulnResolutionType[] = [
  "fix",
  "mitigation",
  "false_positive",
  "wont_fix",
];

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);
const ROLES_CAN_FLAG_EXPLOIT = new Set(["admin", "compliance_officer"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ageDays(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / MS_PER_DAY));
}

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  return src
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function VulnerabilitiesContent({
  productId,
  initialVulns,
  members,
  currentUserRole,
}: {
  productId: string;
  initialVulns: VulnListItem[];
  members: TeamMemberOption[];
  currentUserRole: string | null;
}) {
  const t = useTranslations("vulnerabilities");
  const tStatus = useTranslations("vulnerabilities.status");
  const tSev = useTranslations("vulnerabilities.severity");
  const tRes = useTranslations("vulnerabilities.resolution");
  const { toast } = useToast();
  const [vulns, setVulns] = useState<VulnListItem[]>(initialVulns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<VulnStatus>>(
    new Set(["open", "in_progress"]),
  );
  const [severityFilter, setSeverityFilter] = useState<Set<VulnSeverity>>(
    new Set(),
  );
  const [kevOnly, setKevOnly] = useState(false);
  const [exploitOnly, setExploitOnly] = useState(false);
  const [assigneeFilter, setAssigneeFilter] =
    useState<"all" | "unassigned" | "mine" | string>("all");
  const [resolveTarget, setResolveTarget] = useState<{
    ids: string[];
    status: "resolved" | "accepted";
  } | null>(null);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const canWrite = !!currentUserRole && ROLES_CAN_WRITE.has(currentUserRole);
  const canFlagExploit =
    !!currentUserRole && ROLES_CAN_FLAG_EXPLOIT.has(currentUserRole);

  // Derived KPIs for the stat bar ------------------------------------------
  const kpis = useMemo(() => {
    const total = vulns.length;
    const open = vulns.filter(
      (v) => v.status === "open" || v.status === "in_progress",
    ).length;
    const critical = vulns.filter(
      (v) =>
        v.severity === "critical" &&
        (v.status === "open" || v.status === "in_progress"),
    ).length;
    const kev = vulns.filter(
      (v) =>
        v.cisa_kev && (v.status === "open" || v.status === "in_progress"),
    ).length;
    const exploited = vulns.filter((v) => v.actively_exploited).length;
    return { total, open, critical, kev, exploited };
  }, [vulns]);

  // Filter predicate --------------------------------------------------------
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vulns.filter((v) => {
      if (statusFilter.size > 0 && !statusFilter.has(v.status)) return false;
      if (severityFilter.size > 0 && !severityFilter.has(v.severity))
        return false;
      if (kevOnly && !v.cisa_kev) return false;
      if (exploitOnly && !v.actively_exploited) return false;
      if (assigneeFilter === "unassigned" && v.assignee) return false;
      if (
        assigneeFilter !== "all" &&
        assigneeFilter !== "unassigned" &&
        (v.assignee?.id ?? null) !== assigneeFilter
      ) {
        return false;
      }
      if (term) {
        const hay = `${v.cve_id} ${v.component_name}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [
    vulns,
    search,
    statusFilter,
    severityFilter,
    kevOnly,
    exploitOnly,
    assigneeFilter,
  ]);

  // Total number of active filters (search excluded — it has its own
  // clear button inside the input). Drives the "Clear all" affordance.
  const activeFilterCount =
    statusFilter.size +
    severityFilter.size +
    (kevOnly ? 1 : 0) +
    (exploitOnly ? 1 : 0) +
    (assigneeFilter !== "all" ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setStatusFilter(new Set());
    setSeverityFilter(new Set());
    setKevOnly(false);
    setExploitOnly(false);
    setAssigneeFilter("all");
  }, []);

  // Optimistic local update -------------------------------------------------
  const applyLocal = useCallback(
    (ids: string[], patch: Partial<VulnListItem>) => {
      setVulns((prev) =>
        prev.map((v) => (ids.includes(v.id) ? { ...v, ...patch } : v)),
      );
    },
    [],
  );

  // Server call wrappers ----------------------------------------------------
  const changeStatus = useCallback(
    (
      ids: string[],
      status: VulnStatus,
      options: {
        notes?: string | null;
        resolutionType?: VulnResolutionType | null;
      } = {},
    ) => {
      startTransition(async () => {
        applyLocal(ids, {
          status,
          resolved_at:
            status === "resolved" || status === "accepted"
              ? new Date().toISOString()
              : null,
          resolution_notes:
            status === "resolved" || status === "accepted"
              ? options.notes ?? null
              : null,
          resolution_type:
            status === "resolved" || status === "accepted"
              ? options.resolutionType ?? null
              : null,
        });

        const res =
          ids.length === 1
            ? await updateVulnerabilityStatus(ids[0], status, options, productId)
            : await bulkUpdateVulnStatus(ids, status, options, productId);

        if (res.error) {
          toast({ type: "error", message: t("toast.updateFailed") });
        } else {
          toast({
            type: "success",
            message:
              ids.length === 1
                ? t("toast.statusUpdated")
                : t("toast.bulkUpdated", { count: ids.length }),
          });
          setSelected(new Set());
        }
      });
    },
    [applyLocal, productId, t, toast],
  );

  const changeAssignee = useCallback(
    (ids: string[], userId: string | null) => {
      const assignee = userId ? members.find((m) => m.id === userId) : null;
      startTransition(async () => {
        applyLocal(ids, { assignee: assignee ?? null });
        const res =
          ids.length === 1
            ? await assignVulnerability(ids[0], userId, productId)
            : await bulkAssignVulnerabilities(ids, userId, productId);

        if (res.error) {
          toast({ type: "error", message: t("toast.updateFailed") });
        } else {
          toast({ type: "success", message: t("toast.assignmentUpdated") });
          setSelected(new Set());
        }
      });
    },
    [applyLocal, members, productId, t, toast],
  );

  const toggleExploit = useCallback(
    (id: string, flag: boolean) => {
      startTransition(async () => {
        applyLocal([id], { actively_exploited: flag });
        const res = await setActivelyExploited(id, flag, productId);
        if (res.error) {
          toast({ type: "error", message: t("toast.updateFailed") });
        } else {
          toast({
            type: "success",
            message: flag
              ? t("toast.markedExploited")
              : t("toast.unmarkedExploited"),
          });
        }
      });
    },
    [applyLocal, productId, t, toast],
  );

  // Selection helpers -------------------------------------------------------
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((v) => selected.has(v.id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) return new Set();
      const next = new Set(prev);
      for (const v of filtered) next.add(v.id);
      return next;
    });
  };
  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isEmpty = vulns.length === 0;
  const filteredEmpty = vulns.length > 0 && filtered.length === 0;

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  if (isEmpty) {
    return (
      <div
        className="overflow-hidden rounded-lg border border-border bg-card shadow-card-md px-6 py-20 text-center"
      >
        <IconBadge name="shield-check" tone="success" size="xl" className="mx-auto" />
        <h2 className="mt-5 text-h4 text-foreground">
          {t("empty.title")}
        </h2>
        <p className="mt-2 text-p3 text-muted-foreground">{t("empty.description")}</p>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <StaggerReveal
        className="space-y-6"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        {/* ── Stat bar ── */}
        <div
          data-reveal
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {/* KPI tiles — accent stripe tones map to palette tokens:
              primary for "total", accent for "open", destructive for
              the three critical-flag tiles. */}
          <StatCard label={t("kpi.total")} from="var(--primary)">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {kpis.total}
            </p>
          </StatCard>
          <StatCard label={t("kpi.open")} from="var(--accent)">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {kpis.open}
            </p>
          </StatCard>
          <StatCard label={t("kpi.critical")} from="var(--destructive)">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {kpis.critical}
            </p>
          </StatCard>
          <StatCard label={t("kpi.kev")} from="var(--destructive)">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {kpis.kev}
            </p>
          </StatCard>
          <StatCard
            label={t("kpi.exploited")}
            from="var(--destructive)"
            accentDot
            pulse={kpis.exploited > 0}
          >
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {kpis.exploited}
            </p>
          </StatCard>
        </div>

        {/* ── Filter bar ── */}
        <div
          data-reveal
          className="overflow-hidden rounded-lg border border-border bg-card shadow-card-md"
        >
          {/* Search row — takes full width for scannability */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("filter.searchPlaceholder")}
                className="h-10 pl-10 pr-10"
              />
              <Icon
                name="search-02-stroke-rounded"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t("filter.clearAll")}
                >
                  <Icon name="add-01" size={14} className="rotate-45" />
                </button>
              )}
            </div>
          </div>

          {/* Filter row — chips, with active-count + clear-all on the right */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <MultiSelect
              label={t("filter.status")}
              options={STATUS_ORDER.map((s) => ({
                value: s,
                label: tStatus(s),
              }))}
              selected={statusFilter}
              onToggle={(v) => {
                setStatusFilter((prev) => {
                  const next = new Set(prev);
                  if (next.has(v as VulnStatus)) next.delete(v as VulnStatus);
                  else next.add(v as VulnStatus);
                  return next;
                });
              }}
              onClear={() => setStatusFilter(new Set())}
            />

            <MultiSelect
              label={t("filter.severity")}
              options={SEVERITY_ORDER.map((s) => ({
                value: s,
                label: tSev(s),
                color: SEVERITY_COLOR[s],
              }))}
              selected={severityFilter}
              onToggle={(v) => {
                setSeverityFilter((prev) => {
                  const next = new Set(prev);
                  if (next.has(v as VulnSeverity))
                    next.delete(v as VulnSeverity);
                  else next.add(v as VulnSeverity);
                  return next;
                });
              }}
              onClear={() => setSeverityFilter(new Set())}
            />

            <ToggleChip
              active={kevOnly}
              label={t("filter.kevOnly")}
              color="var(--destructive)"
              onClick={() => setKevOnly((v) => !v)}
            />

            <ToggleChip
              active={exploitOnly}
              label={t("filter.exploitedOnly")}
              color="var(--destructive)"
              onClick={() => setExploitOnly((v) => !v)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <Icon name="one-circle-stroke-rounded" size={14} />
                {assigneeFilter === "all"
                  ? t("filter.anyAssignee")
                  : assigneeFilter === "unassigned"
                    ? t("filter.unassigned")
                    : members.find((m) => m.id === assigneeFilter)
                        ?.full_name ?? t("filter.assignee")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => setAssigneeFilter("all")}>
                  {t("filter.anyAssignee")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAssigneeFilter("unassigned")}
                >
                  {t("filter.unassigned")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("filter.byMember")}</DropdownMenuLabel>
                {members.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setAssigneeFilter(m.id)}
                  >
                    <Avatar size="sm">
                      {m.avatar_url && (
                        <AvatarImage src={m.avatar_url} alt="" />
                      )}
                      <AvatarFallback>
                        {initialsOf(m.full_name, m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {m.full_name ?? m.email ?? m.id}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <div className="ml-auto flex items-center gap-2 pl-2">
                <span className="text-l6-plus tabular-nums text-muted-foreground">
                  {t("filter.activeFilters", { count: activeFilterCount })}
                </span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-sm px-2 py-1 text-l6 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  {t("filter.clearAll")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Bulk action bar ── */}
        {selected.size > 0 && canWrite && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-2 pl-4">
            <span className="text-l6 text-primary">
              {t("bulk.selected", { count: selected.size })}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <BulkStatusPicker
                labels={(k) => tStatus(k)}
                onPick={(s) => {
                  const ids = Array.from(selected);
                  if (s === "resolved" || s === "accepted") {
                    setResolveTarget({ ids, status: s });
                  } else {
                    changeStatus(ids, s);
                  }
                }}
                label={t("bulk.changeStatus")}
              />
              <BulkAssignPicker
                members={members}
                labels={{
                  unassign: t("bulk.unassign"),
                  assign: t("bulk.assign"),
                }}
                onPick={(uid) => changeAssignee(Array.from(selected), uid)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                {t("bulk.clear")}
              </Button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div
          data-reveal
          className="overflow-hidden rounded-lg border border-border bg-card shadow-card-md"
        >
          <div className="flex items-center border-b border-border px-4 py-2.5 text-h6 text-muted-foreground">
            {canWrite && (
              <label className="flex w-8 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="size-3.5 accent-primary"
                  aria-label={t("table.selectAll")}
                />
              </label>
            )}
            <span className="flex-1">{t("table.cve")}</span>
            <span className="hidden w-44 sm:block">{t("table.component")}</span>
            <span className="hidden w-14 sm:block">{t("table.age")}</span>
            <span className="hidden w-28 md:block">{t("table.assignee")}</span>
            <span className="w-32 text-right">{t("table.status")}</span>
            <div className="w-8" />
          </div>

          {filteredEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-p3 text-muted-foreground">
                {t("empty.filtered")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearch("");
                  setStatusFilter(new Set());
                  setSeverityFilter(new Set());
                  setKevOnly(false);
                  setExploitOnly(false);
                  setAssigneeFilter("all");
                }}
              >
                {t("empty.clearFilters")}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((v) => (
                <VulnRow
                  key={v.id}
                  vuln={v}
                  selected={selected.has(v.id)}
                  onToggleSelect={() => toggleSelectOne(v.id)}
                  members={members}
                  canWrite={canWrite}
                  canFlagExploit={canFlagExploit}
                  tStatus={tStatus}
                  tSev={tSev}
                  tRes={tRes}
                  t={t}
                  onStatusChange={(status) => {
                    if (status === "resolved" || status === "accepted") {
                      setResolveTarget({ ids: [v.id], status });
                    } else {
                      changeStatus([v.id], status);
                    }
                  }}
                  onAssign={(uid) => changeAssignee([v.id], uid)}
                  onToggleExploit={(flag) => toggleExploit(v.id, flag)}
                />
              ))}
            </div>
          )}
        </div>
      </StaggerReveal>

      <ResolveModal
        target={resolveTarget}
        onClose={() => setResolveTarget(null)}
        onConfirm={(notes, resolutionType) => {
          if (!resolveTarget) return;
          changeStatus(resolveTarget.ids, resolveTarget.status, {
            notes,
            resolutionType,
          });
          setResolveTarget(null);
        }}
        tRes={tRes}
        tStatus={tStatus}
        t={t}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter UI bits
// ---------------------------------------------------------------------------

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: { value: string; label: string; color?: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const count = selected.size;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        {label}
        {count > 0 && (
          <span className="ml-1 rounded-sm bg-primary/15 px-1.5 text-l6-plus tabular-nums text-primary">
            {count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={(e) => {
              e.preventDefault();
              onToggle(o.value);
            }}
            closeOnClick={false}
          >
            <span className="flex size-4 items-center justify-center rounded border border-border">
              {selected.has(o.value) && (
                <Icon
                  name="checkmark-circle-01-stroke-rounded"
                  size={12}
                  className="text-primary"
                />
              )}
            </span>
            {o.color && (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: o.color }}
              />
            )}
            <span>{o.label}</span>
          </DropdownMenuItem>
        ))}
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              <Icon
                name="circle-stroke-rounded"
                size={12}
                className="text-muted-foreground"
              />
              <span className="text-muted-foreground">Clear</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToggleChip({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-sm border-[1.5px] px-3 text-l6 transition-colors",
        active
          ? "border-[color:var(--chip)] bg-[color:var(--chip)]/10 text-[color:var(--chip)]"
          : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
      )}
      style={{ ["--chip" as string]: color }}
    >
      <span
        className={cn("size-1.5 rounded-full", active && "animate-pulse")}
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Bulk pickers
// ---------------------------------------------------------------------------

function BulkStatusPicker({
  labels,
  onPick,
  label,
}: {
  labels: (s: VulnStatus) => string;
  onPick: (s: VulnStatus) => void;
  label: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onPick(s)}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[s] }}
            />
            {labels(s)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BulkAssignPicker({
  members,
  labels,
  onPick,
}: {
  members: TeamMemberOption[];
  labels: { unassign: string; assign: string };
  onPick: (uid: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        {labels.assign}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuItem onClick={() => onPick(null)}>
          <Icon
            name="circle-stroke-rounded"
            size={14}
            className="text-muted-foreground"
          />
          {labels.unassign}
        </DropdownMenuItem>
        {members.length > 0 && <DropdownMenuSeparator />}
        {members.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => onPick(m.id)}>
            <Avatar size="sm">
              {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
              <AvatarFallback>
                {initialsOf(m.full_name, m.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{m.full_name ?? m.email ?? m.id}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function VulnRow({
  vuln,
  selected,
  onToggleSelect,
  members,
  canWrite,
  canFlagExploit,
  tStatus,
  tSev,
  tRes,
  t,
  onStatusChange,
  onAssign,
  onToggleExploit,
}: {
  vuln: VulnListItem;
  selected: boolean;
  onToggleSelect: () => void;
  members: TeamMemberOption[];
  canWrite: boolean;
  canFlagExploit: boolean;
  tStatus: (key: string) => string;
  tSev: (key: string) => string;
  tRes: (key: string) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onStatusChange: (s: VulnStatus) => void;
  onAssign: (uid: string | null) => void;
  onToggleExploit: (flag: boolean) => void;
}) {
  const age = ageDays(vuln.discovery_date);

  return (
    <div
      className={cn(
        "group relative flex items-center px-4 py-3 transition-colors hover:bg-muted/60",
        selected && "bg-primary/5",
      )}
    >
      {canWrite && (
        <label className="flex w-8 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="size-3.5 accent-primary"
            aria-label={t("table.selectRow", { cve: vuln.cve_id })}
          />
        </label>
      )}

      {/* Severity bar on left edge */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: SEVERITY_COLOR[vuln.severity] }}
      />

      {/* CVE + badges */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-sm px-1.5 py-0.5 text-l6-plus uppercase tracking-wide text-white"
            style={{ backgroundColor: SEVERITY_COLOR[vuln.severity] }}
          >
            {tSev(vuln.severity)}
          </span>
          <span className="font-mono text-l6 text-foreground">
            {vuln.cve_id}
          </span>
          {vuln.cvss_score !== null && (
            <span className="text-l6-plus tabular-nums text-muted-foreground">
              CVSS {vuln.cvss_score}
            </span>
          )}
          {vuln.cisa_kev && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-destructive/15 px-2 py-0.5 text-l6-plus uppercase tracking-wide text-destructive">
              KEV
            </span>
          )}
          {vuln.actively_exploited && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-destructive/20 px-2 py-0.5 text-l6-plus uppercase tracking-wide text-destructive">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
              {t("row.actively_exploited")}
            </span>
          )}
          {vuln.resolution_type && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground">
              {tRes(vuln.resolution_type)}
            </span>
          )}
        </div>
        {vuln.description && (
          <p className="mt-1 line-clamp-1 text-p4 text-muted-foreground">
            {vuln.description}
          </p>
        )}
      </div>

      {/* Component */}
      <div className="hidden w-44 min-w-0 sm:block">
        <p className="truncate text-l6 text-foreground">
          {vuln.component_name || "—"}
        </p>
        {vuln.component_version && (
          <p className="truncate text-p4 text-muted-foreground">
            {vuln.component_version}
          </p>
        )}
      </div>

      {/* Age */}
      <div className="hidden w-14 text-p4 text-muted-foreground sm:block">
        {age !== null ? t("row.daysOld", { days: age }) : "—"}
      </div>

      {/* Assignee */}
      <div className="hidden w-28 md:block">
        {canWrite ? (
          <AssigneePicker
            assignee={vuln.assignee}
            members={members}
            onAssign={onAssign}
            unassignLabel={t("row.unassign")}
            assignLabel={t("row.assign")}
          />
        ) : vuln.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar size="sm">
              {vuln.assignee.avatar_url && (
                <AvatarImage src={vuln.assignee.avatar_url} alt="" />
              )}
              <AvatarFallback>
                {initialsOf(vuln.assignee.full_name, vuln.assignee.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-p4">
              {vuln.assignee.full_name ?? vuln.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-p4 text-muted-foreground">
            {t("row.unassigned")}
          </span>
        )}
      </div>

      {/* Status pill */}
      <div className="w-32 text-right">
        <StatusPill
          status={vuln.status}
          label={tStatus(vuln.status)}
          labels={(s) => tStatus(s)}
          disabled={!canWrite}
          onChange={onStatusChange}
        />
      </div>

      {/* Row menu */}
      <div className="flex w-8 justify-end">
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("row.more")}
                />
              }
            >
              <Icon name="menu-02" size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canFlagExploit && (
                <DropdownMenuItem
                  onClick={() => onToggleExploit(!vuln.actively_exploited)}
                  variant={vuln.actively_exploited ? "default" : "destructive"}
                >
                  <Icon name="alert-02" size={14} />
                  {vuln.actively_exploited
                    ? t("row.unmarkExploited")
                    : t("row.markExploited")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status pill dropdown
// ---------------------------------------------------------------------------

function StatusPill({
  status,
  label,
  labels,
  disabled,
  onChange,
}: {
  status: VulnStatus;
  label: string;
  labels: (s: VulnStatus) => string;
  disabled?: boolean;
  onChange: (s: VulnStatus) => void;
}) {
  const color = STATUS_COLOR[status];
  const pill = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-l6 transition-transform",
        !disabled && "hover:-translate-y-0.5",
      )}
      style={{
        borderColor: `${color}4D`,
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );

  if (disabled) return pill;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className="outline-none" />}
      >
        {pill}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onChange(s)}
            className={cn(s === status && "bg-accent")}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[s] }}
            />
            {labels(s)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Assignee picker (inline avatar trigger)
// ---------------------------------------------------------------------------

function AssigneePicker({
  assignee,
  members,
  onAssign,
  unassignLabel,
  assignLabel,
}: {
  assignee: VulnListItem["assignee"];
  members: TeamMemberOption[];
  onAssign: (uid: string | null) => void;
  unassignLabel: string;
  assignLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 justify-start gap-1.5 px-1.5",
            )}
          />
        }
      >
        {assignee ? (
          <>
            <Avatar size="sm">
              {assignee.avatar_url && (
                <AvatarImage src={assignee.avatar_url} alt="" />
              )}
              <AvatarFallback>
                {initialsOf(assignee.full_name, assignee.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-p4">
              {assignee.full_name ?? assignee.email}
            </span>
          </>
        ) : (
          <>
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
              <Icon name="add-01" size={12} />
            </span>
            <span className="text-p4 text-muted-foreground">
              {assignLabel}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuItem onClick={() => onAssign(null)}>
          <Icon
            name="circle-stroke-rounded"
            size={14}
            className="text-muted-foreground"
          />
          {unassignLabel}
        </DropdownMenuItem>
        {members.length > 0 && <DropdownMenuSeparator />}
        {members.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => onAssign(m.id)}>
            <Avatar size="sm">
              {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
              <AvatarFallback>
                {initialsOf(m.full_name, m.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{m.full_name ?? m.email ?? m.id}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Resolve / Accept modal
// ---------------------------------------------------------------------------

function ResolveModal({
  target,
  onClose,
  onConfirm,
  tRes,
  tStatus,
  t,
}: {
  target: { ids: string[]; status: "resolved" | "accepted" } | null;
  onClose: () => void;
  onConfirm: (notes: string, resolutionType: VulnResolutionType) => void;
  tRes: (key: string) => string;
  tStatus: (key: string) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [notes, setNotes] = useState("");
  const [resolutionType, setResolutionType] =
    useState<VulnResolutionType>("fix");

  // Reset on new target
  const openKey = target ? `${target.status}-${target.ids.join(",")}` : null;
  const prevKey = useRef<string | null>(null);
  if (openKey !== prevKey.current) {
    prevKey.current = openKey;
    setNotes("");
    setResolutionType(target?.status === "accepted" ? "wont_fix" : "fix");
  }

  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={
        target?.status === "resolved"
          ? t("modal.resolveTitle", { count: target?.ids.length ?? 0 })
          : t("modal.acceptTitle", { count: target?.ids.length ?? 0 })
      }
      description={
        target?.status === "resolved"
          ? t("modal.resolveDescription")
          : t("modal.acceptDescription")
      }
      confirmLabel={
        target?.status === "resolved"
          ? tStatus("resolved")
          : tStatus("accepted")
      }
      cancelLabel={t("modal.cancel")}
      variant={target?.status === "accepted" ? "default" : "default"}
      disabled={!notes.trim()}
      onConfirm={() => onConfirm(notes, resolutionType)}
    >
      <div className="space-y-3">
        <div>
          <label className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
            {t("modal.resolutionTypeLabel")}
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {RESOLUTION_TYPES.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => setResolutionType(rt)}
                className={cn(
                  "rounded-sm border-[1.5px] px-3 py-2 text-left text-p3 transition-colors",
                  resolutionType === rt
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border-outline bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                )}
              >
                {tRes(rt)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
            {t("modal.notesLabel")}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("modal.notesPlaceholder")}
            className="mt-1.5 min-h-20"
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
