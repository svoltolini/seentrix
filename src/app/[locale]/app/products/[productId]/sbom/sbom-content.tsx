"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  uploadSbom,
  deleteSbom,
  getSbomComponents,
  getComponentVulnerabilities,
  scanVulnerabilities,
  toggleSbomActive,
  listSboms,
  type SbomRecord,
  type SbomComponentRecord,
  type VulnerabilityRecord,
} from "./actions";
import { SbomUploadZone } from "./sbom-upload-zone";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { SbomListItem } from "./sbom-list-item";
import { SbomDeleteDialog } from "./sbom-delete-dialog";

export function SbomContent({
  productId,
  initialSboms,
}: {
  productId: string;
  initialSboms: SbomRecord[];
}) {
  const t = useTranslations("sbom");
  const router = useRouter();
  const [sboms, setSboms] = useState(initialSboms);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [components, setComponents] = useState<
    Record<string, SbomComponentRecord[]>
  >({});
  const [loadingComponents, setLoadingComponents] = useState<string | null>(
    null
  );
  const [showAllComponents, setShowAllComponents] = useState<
    Record<string, boolean>
  >({});

  const [expandedCompId, setExpandedCompId] = useState<string | null>(null);
  const [compVulns, setCompVulns] = useState<
    Record<string, VulnerabilityRecord[]>
  >({});
  const [loadingVulns, setLoadingVulns] = useState<string | null>(null);

  const [scanningId, setScanningId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SbomRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const [sortBy, setSortBy] = useState<"name" | "vulns">("vulns");

  // Aggregate severity stats from active + scanned SBOMs
  const aggregateStats = useMemo(() => {
    const active = sboms.filter((s) => s.is_active && s.last_scanned_at);
    return {
      critical: active.reduce((sum, s) => sum + s.critical_count, 0),
      high: active.reduce((sum, s) => sum + s.high_count, 0),
      medium: active.reduce((sum, s) => sum + s.medium_count, 0),
      low: active.reduce((sum, s) => sum + s.low_count, 0),
      kev: active.reduce((sum, s) => sum + s.kev_count, 0),
      total: active.reduce((sum, s) => sum + s.vulnerability_count, 0),
      hasData: active.length > 0,
    };
  }, [sboms]);

  const refreshSboms = useCallback(async () => {
    const { sboms: refreshed } = await listSboms(productId);
    setSboms(refreshed);
  }, [productId]);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploading(true);

      const formData = new FormData();
      formData.set("file", file);

      const result = await uploadSbom(productId, formData);

      if (result.error) {
        const errorKey = `upload.errors.${result.error}`;
        setUploadError(
          t.has(errorKey) ? t(errorKey) : t("upload.errors.generic")
        );
        setUploading(false);
        return;
      }

      setUploading(false);
      router.refresh();
      await refreshSboms();
    },
    [productId, router, t, refreshSboms]
  );

  async function toggleExpand(sbomId: string) {
    if (expandedId === sbomId) {
      setExpandedId(null);
      setExpandedCompId(null);
      return;
    }

    setExpandedId(sbomId);
    setExpandedCompId(null);

    if (!components[sbomId]) {
      setLoadingComponents(sbomId);
      const result = await getSbomComponents(sbomId);
      setComponents((prev) => ({ ...prev, [sbomId]: result.components }));
      setLoadingComponents(null);
    }
  }

  async function toggleCompExpand(compId: string) {
    if (expandedCompId === compId) {
      setExpandedCompId(null);
      return;
    }

    setExpandedCompId(compId);

    if (!compVulns[compId]) {
      setLoadingVulns(compId);
      const result = await getComponentVulnerabilities(compId);
      setCompVulns((prev) => ({ ...prev, [compId]: result.vulnerabilities }));
      setLoadingVulns(null);
    }
  }

  async function handleScan(sbomId: string) {
    setScanningId(sbomId);
    await scanVulnerabilities(sbomId);

    await refreshSboms();

    const result = await getSbomComponents(sbomId);
    setComponents((prev) => ({ ...prev, [sbomId]: result.components }));

    setCompVulns({});
    setExpandedCompId(null);

    setScanningId(null);
    router.refresh();
  }

  async function handleToggleActive(sbomId: string, isActive: boolean) {
    await toggleSbomActive(sbomId, isActive);
    await refreshSboms();
    router.refresh();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    startTransition(async () => {
      const result = await deleteSbom(targetId);
      if (!result.error) {
        setSboms((prev) => prev.filter((s) => s.id !== targetId));
        if (expandedId === targetId) {
          setExpandedId(null);
          setExpandedCompId(null);
        }
        router.refresh();
      }
      setDeleteTarget(null);
    });
  }

  // Severity tones — palette tokens, used as a left-edge accent stripe
  // on the white aggregate cards. Replaces per-card gradient backgrounds
  // (red→orange→blue etc.) which violated the design memory rule
  // "palette only, no per-card gradients".
  const SEVERITY_CARDS = [
    {
      key: "critical" as const,
      tone: "text-destructive",
      stripe: "bg-destructive",
    },
    { key: "high" as const, tone: "text-warning", stripe: "bg-warning" },
    { key: "medium" as const, tone: "text-primary", stripe: "bg-primary" },
    {
      key: "low" as const,
      tone: "text-muted-foreground",
      stripe: "bg-muted-foreground/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-h3 text-foreground">{t("title")}</h2>
        <p className="mt-0.5 text-p3 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Upload */}
      <SbomUploadZone
        onFile={handleFile}
        uploading={uploading}
        uploadError={uploadError}
      />

      {/* First-time nudge — only shown before any SBOM has been uploaded. */}
      {!aggregateStats.hasData && (
        <AskSeentrixAI
          variant="banner"
          seed="I don't know much about SBOMs — how do I generate one for my product and then upload it to Seentrix?"
          label="New to SBOMs?"
          sublabel="Ask Seentrix AI how to generate one with Syft, Trivy, or a GitHub dependency-graph export — then upload the result above."
        />
      )}

      {/* Severity overview — aggregated from active SBOMs */}
      {aggregateStats.hasData && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEVERITY_CARDS.map((s, i) => (
              <div
                key={s.key}
                className="relative overflow-hidden rounded-lg border border-border bg-card px-4 py-3 opacity-0"
                style={{
                  animation: `fade-in-up 0.5s ease-out ${i * 100}ms forwards`,
                }}
              >
                {/* Left-edge tone accent — same recipe as the
                    vulnerability row severity strip, ties the
                    aggregate counts to the per-row colour key. */}
                <span
                  aria-hidden
                  className={cn("absolute inset-y-0 left-0 w-1", s.stripe)}
                />
                <p
                  className={cn(
                    "text-l6-plus uppercase tracking-wider",
                    s.tone,
                  )}
                >
                  {t(`scan.severity.${s.key}`)}
                </p>
                <p className="mt-1 text-h2 tabular-nums text-foreground">
                  {aggregateStats[s.key]}
                </p>
              </div>
            ))}
          </div>
          {aggregateStats.kev > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-destructive px-2.5 py-0.5 text-l6-plus text-white">
                KEV {aggregateStats.kev}
              </span>
              <span className="text-p4 text-muted-foreground">
                {t("scan.kevLabel")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SBOM list */}
      {sboms.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card py-16 text-center"
        >
          <IconBadge name="chip-stroke-rounded" tone="primary" size="xl" className="mb-5" />
          <p className="text-h4 text-foreground">
            {t("list.empty")}
          </p>
          <p className="mt-2 max-w-sm text-p3 text-muted-foreground">
            {t("list.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sboms.map((sbom) => (
            <SbomListItem
              key={sbom.id}
              sbom={sbom}
              isExpanded={expandedId === sbom.id}
              components={components[sbom.id]}
              isLoading={loadingComponents === sbom.id}
              isScanning={scanningId === sbom.id}
              expandedCompId={expandedCompId}
              compVulns={compVulns}
              loadingVulns={loadingVulns}
              showAll={showAllComponents[sbom.id] ?? false}
              sortBy={sortBy}
              onToggleExpand={() => toggleExpand(sbom.id)}
              onDelete={() => setDeleteTarget(sbom)}
              onScan={() => handleScan(sbom.id)}
              onToggleComp={toggleCompExpand}
              onToggleShowAll={() =>
                setShowAllComponents((prev) => ({
                  ...prev,
                  [sbom.id]: !prev[sbom.id],
                }))
              }
              onSortChange={setSortBy}
              onToggleActive={(active) => handleToggleActive(sbom.id, active)}
            />
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <SbomDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        disabled={isPending}
      />
    </div>
  );
}
