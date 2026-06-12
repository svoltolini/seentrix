"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import type { SbomComponentRecord, VulnerabilityRecord } from "./actions";

const PREVIEW_LIMIT = 20;

// Proper severity ramp (red → amber → gold → grey) via the shared design
// tokens; not Tailwind-mapped, so applied inline like the incidents page.
const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

function tint(color: string): string {
  return `color-mix(in srgb, ${color} 14%, transparent)`;
}

function getVulnUrl(cveId: string): string {
  if (cveId.startsWith("GHSA-")) {
    return `https://github.com/advisories/${cveId}`;
  }
  if (cveId.startsWith("CVE-")) {
    return `https://nvd.nist.gov/vuln/detail/${cveId}`;
  }
  return `https://osv.dev/vulnerability/${cveId}`;
}

export function SbomComponentTable({
  components,
  hasScanned,
  expandedCompId,
  compVulns,
  loadingVulns,
  onToggleComp,
  showAll,
  onToggleShowAll,
  sortBy,
  onSortChange,
}: {
  components: SbomComponentRecord[];
  hasScanned: boolean;
  expandedCompId: string | null;
  compVulns: Record<string, VulnerabilityRecord[]>;
  loadingVulns: string | null;
  onToggleComp: (compId: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
  sortBy: "name" | "vulns";
  onSortChange: (sort: "name" | "vulns") => void;
}) {
  const t = useTranslations("sbom");

  const sorted = [...components];
  if (sortBy === "vulns") {
    sorted.sort((a, b) => b.vulnerability_count - a.vulnerability_count);
  } else {
    sorted.sort((a, b) => a.component_name.localeCompare(b.component_name));
  }

  const displayComps = showAll ? sorted : sorted.slice(0, PREVIEW_LIMIT);

  return (
    <div className="border-t border-border">
      {/* Toolbar — sort control */}
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="text-l6-plus uppercase tracking-wider text-muted-foreground">
          {t("components.name")}
        </span>
        {hasScanned && (
          <Segmented
            value={sortBy}
            onChange={(v) => onSortChange(v as "name" | "vulns")}
            options={[
              { value: "vulns", label: t("components.sortVulns") },
              { value: "name", label: t("components.sortName") },
            ]}
          />
        )}
      </div>

      {/* Component rows — shared list recipe: hairline-divided, muted hover */}
      <div className="divide-y divide-border border-t border-border">
        {displayComps.map((comp) => {
          const isExpanded = expandedCompId === comp.id;
          const vulns = compVulns[comp.id];
          const isVulnLoading = loadingVulns === comp.id;
          const hasCompVulns = comp.vulnerability_count > 0;
          const worstColor =
            comp.critical_vulnerability_count > 0
              ? SEVERITY_COLOR.critical
              : comp.high_vulnerability_count > 0
                ? SEVERITY_COLOR.high
                : SEVERITY_COLOR.medium;

          const meta = [comp.component_version, comp.license]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={comp.id}>
              {/* Component row */}
              <button
                type="button"
                onClick={() => hasCompVulns && onToggleComp(comp.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
                  hasCompVulns ? "hover:bg-muted/60" : "cursor-default",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-l6 text-foreground">
                    {comp.component_name}
                  </span>
                  {meta && (
                    <span className="block truncate text-p4 tabular-nums text-muted-foreground">
                      {meta}
                    </span>
                  )}
                </span>

                {hasScanned &&
                  (hasCompVulns ? (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums"
                      style={{ backgroundColor: tint(worstColor), color: worstColor }}
                    >
                      {comp.vulnerability_count}
                    </span>
                  ) : (
                    <span className="shrink-0 text-p4 text-muted-foreground">—</span>
                  ))}

                {hasCompVulns && (
                  <Icon
                    name="ChevronDownIcon"
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                )}
              </button>

              {/* Expanded vulnerabilities */}
              {isExpanded && (
                <div className="bg-muted/40 px-5 pb-3 pt-1">
                  {isVulnLoading ? (
                    <div className="py-4 text-center text-p4 text-muted-foreground">
                      {t("scan.loadingVulns")}
                    </div>
                  ) : vulns && vulns.length > 0 ? (
                    <ul className="divide-y divide-border/70">
                      {vulns.map((v) => {
                        const vulnUrl = getVulnUrl(v.cve_id);
                        const sevColor =
                          SEVERITY_COLOR[v.severity] ?? SEVERITY_COLOR.low;
                        return (
                          <li key={v.id} className="flex items-start gap-3 py-2.5">
                            <span
                              className="mt-[5px] size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: sevColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <a
                                  href={vulnUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-l6 text-foreground transition-colors hover:text-primary"
                                >
                                  {v.cve_id}
                                  <Icon
                                    name="ExternalLinkIcon"
                                    className="size-2.5 text-muted-foreground"
                                  />
                                </a>
                                <span
                                  className="rounded-full px-2 py-px text-[10px] font-bold uppercase tracking-wide"
                                  style={{
                                    backgroundColor: tint(sevColor),
                                    color: sevColor,
                                  }}
                                >
                                  {t(`scan.severity.${v.severity}`)}
                                </span>
                                {v.cvss_score !== null && (
                                  <span className="text-p4 tabular-nums text-muted-foreground">
                                    CVSS {v.cvss_score.toFixed(1)}
                                  </span>
                                )}
                                {v.cisa_kev && (
                                  <span className="rounded-full bg-destructive px-2 py-px text-[10px] font-bold uppercase tracking-wide text-white">
                                    KEV
                                  </span>
                                )}
                              </div>
                              {v.description ? (
                                <p className="mt-0.5 line-clamp-2 text-p4 leading-relaxed text-muted-foreground">
                                  {v.description}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-p4 text-muted-foreground">
                                  {t("scan.noDescription")}{" "}
                                  <a
                                    href={vulnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:underline"
                                  >
                                    {t("scan.viewDetails")}
                                  </a>
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="py-4 text-center text-p4 text-muted-foreground">
                      {t("scan.noVulnsForComp")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {sorted.length > PREVIEW_LIMIT && (
        <div className="border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-l6 font-semibold text-primary hover:underline"
          >
            {showAll
              ? t("components.showLess")
              : t("components.showAll", { count: sorted.length })}
          </button>
        </div>
      )}
    </div>
  );
}
