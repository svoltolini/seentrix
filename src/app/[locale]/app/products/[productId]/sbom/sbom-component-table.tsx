"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import type { SbomComponentRecord, VulnerabilityRecord } from "./actions";

const PREVIEW_LIMIT = 20;

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-[#DC2626]",
  high: "bg-[#D97706]",
  medium: "bg-[#0891B2]",
  low: "bg-[#52525B]",
};

const SEVERITY_PILL: Record<string, string> = {
  critical: "bg-[#DC2626]",
  high: "bg-[#D97706]",
  medium: "bg-[#0891B2]",
  low: "bg-[#52525B]",
};

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
    <div className="border-t border-white/[0.04]">
      {/* Column headers */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-2.5">
        <div className="w-5 shrink-0" />

        <button
          type="button"
          onClick={() => onSortChange("name")}
          className={cn(
            "min-w-0 flex-1 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors",
            sortBy === "name"
              ? "text-foreground"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          )}
        >
          {t("components.name")}
        </button>

        <span className="hidden w-32 shrink-0 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 sm:block">
          {t("components.version")}
        </span>

        <span className="hidden w-36 shrink-0 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 md:block">
          {t("components.license")}
        </span>

        {hasScanned && (
          <button
            type="button"
            onClick={() => onSortChange("vulns")}
            className={cn(
              "w-24 shrink-0 text-center text-[11px] font-semibold uppercase tracking-wider transition-colors",
              sortBy === "vulns"
                ? "text-foreground"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
          >
            {t("components.vulns")}
          </button>
        )}
      </div>

      {/* Component rows */}
      <div>
        {displayComps.map((comp, idx) => {
          const isCompExpanded = expandedCompId === comp.id;
          const vulns = compVulns[comp.id];
          const isVulnLoading = loadingVulns === comp.id;
          const hasCompVulns = comp.vulnerability_count > 0;
          const otherCount =
            comp.vulnerability_count -
            comp.critical_vulnerability_count -
            comp.high_vulnerability_count;

          return (
            <div
              key={comp.id}
              className={cn(
                idx % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent"
              )}
            >
              {/* Component row */}
              <button
                type="button"
                onClick={() => hasCompVulns && onToggleComp(comp.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                  hasCompVulns
                    ? "cursor-pointer hover:bg-white/[0.03]"
                    : "cursor-default"
                )}
              >
                <div className="flex w-5 shrink-0 items-center justify-center">
                  {hasCompVulns ? (
                    <ChevronDownIcon
                      className={cn(
                        "size-3.5 text-muted-foreground/40 transition-transform",
                        isCompExpanded && "rotate-180"
                      )}
                    />
                  ) : (
                    <div className="size-1 rounded-full bg-muted-foreground/15" />
                  )}
                </div>

                <div className="min-w-0 flex-1 truncate">
                  <span className="text-[13px] font-medium text-foreground">
                    {comp.component_name}
                  </span>
                </div>

                <div className="hidden w-32 shrink-0 items-center justify-center sm:flex">
                  {comp.component_version ? (
                    <span className="max-w-full truncate rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {comp.component_version}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/15">—</span>
                  )}
                </div>

                <div className="hidden w-36 shrink-0 items-center justify-center md:flex">
                  {comp.license ? (
                    <span className="max-w-full truncate rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground/50">
                      {comp.license}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/15">—</span>
                  )}
                </div>

                {hasScanned && (
                  <div className="flex w-24 shrink-0 items-center justify-center gap-1">
                    {hasCompVulns ? (
                      <>
                        {comp.critical_vulnerability_count > 0 && (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                            {comp.critical_vulnerability_count}
                          </span>
                        )}
                        {comp.high_vulnerability_count > 0 && (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#D97706] text-[10px] font-bold text-white">
                            {comp.high_vulnerability_count}
                          </span>
                        )}
                        {otherCount > 0 && (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold text-muted-foreground">
                            {otherCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/20">
                        —
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Expanded vulnerabilities */}
              {isCompExpanded && (
                <div className="pb-3 pl-[52px] pr-5 pt-0.5">
                  {isVulnLoading ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      {t("scan.loadingVulns")}
                    </div>
                  ) : vulns && vulns.length > 0 ? (
                    <div className="space-y-0">
                      {vulns.map((v, vi) => {
                        const vulnUrl = getVulnUrl(v.cve_id);

                        return (
                          <div
                            key={v.id}
                            className="flex items-start gap-3 py-2.5"
                            style={{
                              opacity: 0,
                              animation: `fade-in-up 0.3s ease-out ${vi * 50}ms forwards`,
                            }}
                          >
                            {/* Severity dot */}
                            <div
                              className={cn(
                                "mt-[5px] size-2 shrink-0 rounded-full",
                                SEVERITY_DOT[v.severity] ?? "bg-[#52525B]"
                              )}
                            />

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <a
                                  href={vulnUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-primary"
                                >
                                  {v.cve_id}
                                  <ExternalLinkIcon className="size-2.5 text-muted-foreground/30" />
                                </a>
                                <span
                                  className={cn(
                                    "rounded-full px-1.5 py-px text-[10px] font-semibold text-white",
                                    SEVERITY_PILL[v.severity] ?? "bg-[#52525B]"
                                  )}
                                >
                                  {t(`scan.severity.${v.severity}`)}
                                </span>
                                {v.cvss_score !== null && (
                                  <span className="text-[10px] tabular-nums text-muted-foreground/40">
                                    CVSS {v.cvss_score.toFixed(1)}
                                  </span>
                                )}
                                {v.cisa_kev && (
                                  <span className="rounded-full bg-destructive px-1.5 py-px text-[9px] font-bold text-white">
                                    KEV
                                  </span>
                                )}
                              </div>
                              {v.description ? (
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/40">
                                  {v.description}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-[11px] text-muted-foreground/25">
                                  {t("scan.noDescription")}{" "}
                                  <a
                                    href={vulnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary/50 hover:text-primary hover:underline"
                                  >
                                    {t("scan.viewDetails")}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
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
        <div className="border-t border-white/[0.04] px-5 py-2.5">
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-xs font-medium text-primary hover:underline"
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
