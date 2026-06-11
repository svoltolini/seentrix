"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SbomComponentTable } from "./sbom-component-table";
import type {
  SbomRecord,
  SbomComponentRecord,
  VulnerabilityRecord,
} from "./actions";

export function SbomListItem({
  sbom,
  isExpanded,
  components,
  isLoading,
  isScanning,
  expandedCompId,
  compVulns,
  loadingVulns,
  showAll,
  sortBy,
  onToggleExpand,
  onDelete,
  onScan,
  onToggleComp,
  onToggleShowAll,
  onSortChange,
  onToggleActive,
}: {
  sbom: SbomRecord;
  isExpanded: boolean;
  components: SbomComponentRecord[] | undefined;
  isLoading: boolean;
  isScanning: boolean;
  expandedCompId: string | null;
  compVulns: Record<string, VulnerabilityRecord[]>;
  loadingVulns: string | null;
  showAll: boolean;
  sortBy: "name" | "vulns";
  onToggleExpand: () => void;
  onDelete: () => void;
  onScan: () => void;
  onToggleComp: (compId: string) => void;
  onToggleShowAll: () => void;
  onSortChange: (sort: "name" | "vulns") => void;
  onToggleActive: (active: boolean) => void;
}) {
  const t = useTranslations("sbom");

  const hasScanned = !!sbom.last_scanned_at;
  const hasVulns = sbom.vulnerability_count > 0;
  const isArchived = !sbom.is_active;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card transition-opacity",
        isArchived && "opacity-50"
      )}
    >
      {/* Row header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-l6 text-foreground">
              {sbom.file_name ?? "SBOM"}
            </span>
            <span className="shrink-0 rounded-sm bg-muted px-2.5 py-0.5 text-l6-plus text-muted-foreground">
              {t(`formats.${sbom.sbom_format}`)}
            </span>
            {isArchived && (
              <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-l6-plus text-muted-foreground">
                {t("list.archived")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-p4 text-muted-foreground">
            <span>
              {sbom.total_components}{" "}
              {sbom.total_components === 1 ? "component" : "components"}
            </span>
            {hasScanned && hasVulns && (
              <span className="text-l6 text-destructive">
                {sbom.vulnerability_count}{" "}
                {sbom.vulnerability_count === 1
                  ? t("scan.vuln")
                  : t("scan.vulns")}
              </span>
            )}
            {hasScanned && !hasVulns && (
              <span className="text-success">{t("scan.noVulns")}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Archive / restore toggle */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(!sbom.is_active);
            }}
            className="text-muted-foreground hover:text-foreground"
            title={isArchived ? t("list.restore") : t("list.archive")}
          >
            {isArchived ? (
              <Icon name="ArchiveRestoreIcon" className="size-3.5" />
            ) : (
              <Icon name="ArchiveIcon" className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Icon name="Trash2Icon" className="size-3.5" />
          </Button>
          <Icon name="ChevronDownIcon"
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-p3 text-muted-foreground">
                {t("components.loading")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Scan actions */}
              <div className="px-5 py-4">
                {!hasScanned ? (
                  <div className="flex flex-col items-center gap-3 rounded-md bg-muted py-6">
                    <Button
                      size="sm"
                      disabled={isScanning}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScan();
                      }}
                      className="gap-1.5"
                    >
                      <Icon name="SearchIcon"
                        className={cn(
                          "size-3.5",
                          isScanning && "animate-spin"
                        )}
                      />
                      {isScanning
                        ? t("scan.scanning")
                        : t("scan.scanButton")}
                    </Button>
                    {isScanning && (
                      <span className="text-p4 text-muted-foreground">
                        {t("scan.scanningDescription")}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isScanning}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScan();
                      }}
                      className="gap-1.5"
                    >
                      <Icon name="RefreshCwIcon"
                        className={cn(
                          "size-3.5",
                          isScanning && "animate-spin"
                        )}
                      />
                      {isScanning ? t("scan.scanning") : t("scan.rescan")}
                    </Button>
                    {sbom.kev_count > 0 && (
                      <span className="rounded-sm bg-destructive px-2.5 py-0.5 text-l6-plus text-white">
                        KEV {sbom.kev_count}
                      </span>
                    )}
                    {isScanning && (
                      <span className="text-p4 text-muted-foreground">
                        {t("scan.scanningDescription")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Component table */}
              {components && components.length > 0 && (
                <SbomComponentTable
                  components={components}
                  hasScanned={hasScanned}
                  expandedCompId={expandedCompId}
                  compVulns={compVulns}
                  loadingVulns={loadingVulns}
                  onToggleComp={onToggleComp}
                  showAll={showAll}
                  onToggleShowAll={onToggleShowAll}
                  sortBy={sortBy}
                  onSortChange={onSortChange}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
