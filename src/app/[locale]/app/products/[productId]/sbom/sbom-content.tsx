"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
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

  async function refreshSboms() {
    const { sboms: refreshed } = await listSboms(productId);
    setSboms(refreshed);
  }

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
    [productId, router, t]
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

  const SEVERITY_CARDS = [
    { key: "critical" as const, gradient: "linear-gradient(135deg, #DC2626, #E11D48)" },
    { key: "high" as const, gradient: "linear-gradient(135deg, #D97706, #EA580C)" },
    { key: "medium" as const, gradient: "linear-gradient(135deg, #0891B2, #0E7490)" },
    { key: "low" as const, gradient: "linear-gradient(135deg, #52525B, #3F3F46)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Upload */}
      <SbomUploadZone
        onFile={handleFile}
        uploading={uploading}
        uploadError={uploadError}
      />

      {/* Severity overview — aggregated from active SBOMs */}
      {aggregateStats.hasData && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEVERITY_CARDS.map((s, i) => (
              <div
                key={s.key}
                className="overflow-hidden rounded-xl px-4 py-3 opacity-0"
                style={{
                  background: s.gradient,
                  animation: `fade-in-up 0.5s ease-out ${i * 100}ms forwards`,
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  {t(`scan.severity.${s.key}`)}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {aggregateStats[s.key]}
                </p>
              </div>
            ))}
          </div>
          {aggregateStats.kev > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[11px] font-semibold text-white">
                KEV {aggregateStats.kev}
              </span>
              <span className="text-xs text-muted-foreground/40">
                {t("scan.kevLabel")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SBOM list */}
      {sboms.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center overflow-hidden rounded-xl bg-cover bg-center py-16 text-center"
          style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
        >
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-black/20">
            <HugeIcon
              name="chip-stroke-rounded"
              size={28}
              className="text-white"
            />
          </div>
          <p className="text-base font-semibold text-white">
            {t("list.empty")}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/65">
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
