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

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  SideSheetBackdrop,
  SideSheetPopup,
  SideSheetHero,
  SideSheetBody,
} from "@/components/side-sheet";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

// Status pill hue (the .sx-pill tint): open=red/bad, in_progress=amber/warn,
// resolved + accepted = green/ok.
const STATUS_TINT: Record<VulnStatus, string> = {
  open: "var(--sev-critical)",
  in_progress: "var(--sev-high)",
  resolved: "var(--success)",
  accepted: "var(--success)",
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

/** CVSS score → colour ramp: high red, mid amber, low grey. */
function cvssColor(score: number): string {
  if (score >= 7) return "var(--sev-critical)";
  if (score >= 4) return "var(--sev-high)";
  return "var(--sev-low)";
}

/** A 13%-opacity wash of a colour for tinted pills. */
function tint13(color: string): string {
  return `color-mix(in srgb, ${color} 13%, transparent)`;
}

/** Authoritative reference URL for a CVE / GHSA / other advisory id. */
function vulnUrl(id: string): string {
  if (id.startsWith("GHSA-")) return `https://github.com/advisories/${id}`;
  if (id.startsWith("CVE-")) return `https://nvd.nist.gov/vuln/detail/${id}`;
  return `https://osv.dev/vulnerability/${id}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function VulnerabilitiesContent({
  productId,
  initialVulns,
  members,
  currentUserRole,
  canExportAdvisory,
}: {
  productId: string;
  initialVulns: VulnListItem[];
  members: TeamMemberOption[];
  currentUserRole: string | null;
  /** Whether the org's plan allows VEX/CSAF advisory export (Business+). */
  canExportAdvisory: boolean;
}) {
  const t = useTranslations("vulnerabilities");
  const tStatus = useTranslations("vulnerabilities.status");
  const tSev = useTranslations("vulnerabilities.severity");
  const tRes = useTranslations("vulnerabilities.resolution");
  const { toast } = useToast();
  const [vulns, setVulns] = useState<VulnListItem[]>(initialVulns);
  // Tapping a row opens the side drawer; all per-vuln actions live there.
  const [activeId, setActiveId] = useState<string | null>(null);
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

  // Download a machine-readable advisory (CSAF 2.0 or CycloneDX VEX) built
  // from this product's triaged vulnerabilities. The route streams an
  // attachment; an off-DOM anchor click avoids a full-page navigation.
  const exportAdvisory = useCallback(
    (format: "csaf" | "vex") => {
      if (vulns.length === 0) {
        toast({ type: "error", message: t("advisory.empty") });
        return;
      }
      const a = document.createElement("a");
      a.href = `/api/products/${productId}/advisory?format=${format}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    [productId, t, toast, vulns.length],
  );

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

  const isEmpty = vulns.length === 0;
  const filteredEmpty = vulns.length > 0 && filtered.length === 0;
  const activeVuln = activeId ? vulns.find((v) => v.id === activeId) ?? null : null;

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  if (isEmpty) {
    return (
      <div
        className="overflow-hidden rounded-lg border border-border bg-card px-6 py-20 text-center"
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
        className="space-y-[18px]"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        {/* ── Header actions ── */}
        <div data-reveal className="flex items-center justify-end gap-2">
          {canExportAdvisory ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <Icon name="DocumentDownload" size={14} />
                {t("advisory.export")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>{t("advisory.menuLabel")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportAdvisory("csaf")}>
                  <Icon name="Code" size={14} />
                  <span className="flex flex-col">
                    <span>{t("advisory.csaf")}</span>
                    <span className="text-l6 text-muted-foreground">
                      {t("advisory.csafHint")}
                    </span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAdvisory("vex")}>
                  <Icon name="Code" size={14} />
                  <span className="flex flex-col">
                    <span>{t("advisory.vex")}</span>
                    <span className="text-l6 text-muted-foreground">
                      {t("advisory.vexHint")}
                    </span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 py-1.5 text-l6 text-muted-foreground opacity-70"
              title={t("advisory.planRequired")}
            >
              <Icon name="DocumentDownload" size={14} />
              {t("advisory.export")}
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent">
                {t("advisory.businessPlan")}
              </span>
            </span>
          )}
        </div>

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
          className="overflow-hidden rounded-lg border border-border bg-card"
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

        {/* ── List (sx-tablecard) ── tap a row to open the action drawer ── */}
        <div
          data-reveal
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
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
                  tStatus={tStatus}
                  t={t}
                  onOpen={() => setActiveId(v.id)}
                />
              ))}
            </div>
          )}
        </div>
      </StaggerReveal>

      {/* Per-vulnerability action drawer */}
      <VulnSheet
        vuln={activeVuln}
        open={activeVuln !== null}
        onOpenChange={(o) => !o && setActiveId(null)}
        members={members}
        canWrite={canWrite}
        canFlagExploit={canFlagExploit}
        tStatus={tStatus}
        tSev={tSev}
        tRes={tRes}
        t={t}
        onStatusChange={(status) => {
          if (!activeVuln) return;
          if (status === "resolved" || status === "accepted") {
            setResolveTarget({ ids: [activeVuln.id], status });
          } else {
            changeStatus([activeVuln.id], status);
          }
        }}
        onAssign={(uid) => activeVuln && changeAssignee([activeVuln.id], uid)}
        onToggleExploit={(flag) =>
          activeVuln && toggleExploit(activeVuln.id, flag)
        }
      />

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
// Row
// ---------------------------------------------------------------------------

function VulnRow({
  vuln,
  tStatus,
  t,
  onOpen,
}: {
  vuln: VulnListItem;
  tStatus: (key: string) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onOpen: () => void;
}) {
  const statusHue = STATUS_TINT[vuln.status];
  const title = vuln.description?.trim() || vuln.cve_id;
  const component = vuln.component_name
    ? `${vuln.component_name}${vuln.component_version ? ` ${vuln.component_version}` : ""}`
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={vuln.cve_id}
      className="flex w-full items-center gap-[18px] px-[18px] py-[13px] text-left transition-colors hover:bg-muted/60"
    >
      {/* 1. severity tick */}
      <span
        className="h-[34px] w-1 shrink-0 rounded-[3px]"
        style={{ backgroundColor: SEVERITY_COLOR[vuln.severity] }}
        aria-hidden
      />

      {/* 2. main text */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-foreground">
          {title}
        </span>
        <span className="block truncate text-[12.5px] text-muted-foreground">
          <span className="font-mono">{vuln.cve_id}</span>
          {component ? ` · ${component}` : ""}
        </span>
      </span>

      {/* KEV / actively-exploited signals stay visible at a glance */}
      {vuln.actively_exploited && (
        <span
          className="hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex"
          style={{ color: "var(--sev-critical)", backgroundColor: tint13("var(--sev-critical)") }}
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--sev-critical)]" />
          {t("row.actively_exploited")}
        </span>
      )}
      {!vuln.actively_exploited && vuln.cisa_kev && (
        <span
          className="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex"
          style={{ color: "var(--sev-critical)", backgroundColor: tint13("var(--sev-critical)") }}
        >
          KEV
        </span>
      )}

      {/* 3. status pill */}
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize"
        style={{ color: statusHue, backgroundColor: tint13(statusHue) }}
      >
        {tStatus(vuln.status)}
      </span>

      {/* 4. CVSS score */}
      <span
        className="w-9 shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums"
        style={{
          color:
            vuln.cvss_score !== null
              ? cvssColor(vuln.cvss_score)
              : "var(--muted-foreground)",
        }}
      >
        {vuln.cvss_score !== null ? vuln.cvss_score.toFixed(1) : "—"}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Per-vulnerability action drawer
// ---------------------------------------------------------------------------

function VulnSheet({
  vuln,
  open,
  onOpenChange,
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
  vuln: VulnListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  if (!vuln) return null;
  const age = ageDays(vuln.discovery_date);
  const url = vulnUrl(vuln.cve_id);

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SideSheetBackdrop />
        <SideSheetPopup>
          <SideSheetHero
            eyebrow={`${tSev(vuln.severity)}${vuln.cvss_score !== null ? ` · CVSS ${vuln.cvss_score.toFixed(1)}` : ""}`}
            title={vuln.cve_id}
          />
          <SideSheetBody>
            {/* Signal badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: SEVERITY_COLOR[vuln.severity], backgroundColor: tint13(SEVERITY_COLOR[vuln.severity]) }}
              >
                {tSev(vuln.severity)}
              </span>
              {vuln.cisa_kev && (
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  KEV
                </span>
              )}
              {vuln.actively_exploited && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--sev-critical)", backgroundColor: tint13("var(--sev-critical)") }}
                >
                  <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--sev-critical)]" />
                  {t("row.actively_exploited")}
                </span>
              )}
            </div>

            {vuln.description && (
              <p className="text-p3 leading-relaxed text-muted-foreground">
                {vuln.description}
              </p>
            )}

            {/* Meta */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Meta label={t("table.component")}>
                {vuln.component_name || "—"}
                {vuln.component_version ? ` ${vuln.component_version}` : ""}
              </Meta>
              <Meta label={t("table.age")}>
                {age !== null ? t("row.daysOld", { days: age }) : "—"}
              </Meta>
              {vuln.cvss_score !== null && (
                <Meta label="CVSS">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: cvssColor(vuln.cvss_score) }}
                  >
                    {vuln.cvss_score.toFixed(1)}
                  </span>
                </Meta>
              )}
              {vuln.resolution_type && (
                <Meta label={t("table.status")}>{tRes(vuln.resolution_type)}</Meta>
              )}
            </dl>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-l6 text-primary hover:underline"
            >
              {t("row.viewAdvisory")}
              <Icon name="ExternalLinkIcon" className="size-3" />
            </a>

            {canWrite && (
              <>
                {/* Status */}
                <div className="flex flex-col gap-2">
                  <span className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                    {t("table.status")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map((s) => {
                      const on = vuln.status === s;
                      const hue = STATUS_TINT[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onStatusChange(s)}
                          aria-pressed={on}
                          className={cn(
                            "flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-l6-plus transition-colors",
                            on
                              ? ""
                              : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                          style={
                            on
                              ? { color: hue, borderColor: hue, backgroundColor: tint13(hue) }
                              : undefined
                          }
                        >
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                          {tStatus(s)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex flex-col gap-2">
                  <span className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
                    {t("table.assignee")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onAssign(null)}
                      aria-pressed={!vuln.assignee}
                      className={cn(
                        "flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-3 text-[12.5px] font-semibold transition-colors",
                        !vuln.assignee
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {t("row.unassigned")}
                    </button>
                    {members.map((m) => {
                      const on = vuln.assignee?.id === m.id;
                      const first = (m.full_name?.trim() || m.email || m.id).split(/[\s@]/)[0];
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onAssign(on ? null : m.id)}
                          aria-pressed={on}
                          className={cn(
                            "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12.5px] font-semibold transition-colors",
                            on
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Avatar size="sm" className="size-6">
                            {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
                            <AvatarFallback>{initialsOf(m.full_name, m.email)}</AvatarFallback>
                          </Avatar>
                          {first}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actively exploited */}
                {canFlagExploit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-fit",
                      !vuln.actively_exploited &&
                        "text-destructive hover:bg-destructive/10 hover:text-destructive",
                    )}
                    onClick={() => onToggleExploit(!vuln.actively_exploited)}
                  >
                    <Icon name="alert-02" size={14} />
                    {vuln.actively_exploited
                      ? t("row.unmarkExploited")
                      : t("row.markExploited")}
                  </Button>
                )}
              </>
            )}
          </SideSheetBody>
        </SideSheetPopup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-l6-plus uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-p3 text-foreground">{children}</dd>
    </div>
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
