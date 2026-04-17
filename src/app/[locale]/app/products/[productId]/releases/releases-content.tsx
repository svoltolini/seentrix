"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { useLocaleDate } from "@/lib/locale-date";
import {
  createRelease,
  deleteRelease,
  updateProductSupport,
  type ProductRelease,
  type ProductSupport,
  type ReleaseType,
} from "./actions";

const RELEASE_TYPE_COLOR: Record<ReleaseType, string> = {
  security: "#DC2626",
  bugfix: "#D97706",
  feature: "#2563EB",
  maintenance: "#6B7280",
};

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (24 * 3600_000));
}

export function ReleasesContent({
  productId,
  initialReleases,
  initialSupport,
  currentUserRole,
}: {
  productId: string;
  initialReleases: ProductRelease[];
  initialSupport: ProductSupport | null;
  currentUserRole: string | null;
}) {
  const t = useTranslations("releases");
  const { toast } = useToast();
  const [releases, setReleases] = useState(initialReleases);
  const [support, setSupport] = useState<ProductSupport>(
    initialSupport ?? {
      support_period_start: null,
      support_period_end: null,
      update_channel: null,
    },
  );
  const [newOpen, setNewOpen] = useState(false);
  const canWrite = !!currentUserRole && ROLES_CAN_WRITE.has(currentUserRole);

  const summary = useMemo(() => {
    const security = releases.filter((r) => r.is_security_update).length;
    const cves = releases.reduce((n, r) => n + (r.cves_fixed?.length ?? 0), 0);
    const latest = releases[0] ?? null;
    return { total: releases.length, security, cves, latest };
  }, [releases]);

  const supportStatus = useMemo(() => {
    if (!support.support_period_end) return null;
    const end = new Date(support.support_period_end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = daysBetween(today, end);
    if (days < 0) return { key: "outOfSupport", days, color: "#DC2626" };
    if (days < 90)
      return { key: "expiringSoon", days, color: "#D97706" };
    return { key: "inSupport", days, color: "#16A34A" };
  }, [support.support_period_end]);

  async function handleSupportSave(patch: Partial<ProductSupport>) {
    const next = { ...support, ...patch };
    setSupport(next);
    const res = await updateProductSupport(productId, patch);
    if (res.error) toast({ type: "error", message: t("toast.saveFailed") });
    else toast({ type: "success", message: t("toast.saved") });
  }

  return (
    <div>
      <StaggerReveal
        className="space-y-6"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        {/* Support period block */}
        <div
          data-reveal
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">{t("support.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("support.description")}
              </p>
            </div>
            {supportStatus && (
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: `${supportStatus.color}4D`,
                  backgroundColor: `${supportStatus.color}1A`,
                  color: supportStatus.color,
                }}
              >
                {supportStatus.key === "outOfSupport"
                  ? t("support.outOfSupport", {
                      days: Math.abs(supportStatus.days),
                    })
                  : supportStatus.key === "expiringSoon"
                    ? t("support.expiringSoon", { days: supportStatus.days })
                    : t("support.inSupport", { days: supportStatus.days })}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SupportField
              label={t("support.startLabel")}
              value={support.support_period_start ?? ""}
              type="date"
              disabled={!canWrite}
              onSave={(v) => handleSupportSave({ support_period_start: v || null })}
            />
            <SupportField
              label={t("support.endLabel")}
              value={support.support_period_end ?? ""}
              type="date"
              disabled={!canWrite}
              onSave={(v) => handleSupportSave({ support_period_end: v || null })}
            />
            <SupportField
              label={t("support.updateChannelLabel")}
              value={support.update_channel ?? ""}
              placeholder={t("support.updateChannelPlaceholder")}
              disabled={!canWrite}
              onSave={(v) => handleSupportSave({ update_channel: v || null })}
            />
          </div>
        </div>

        {/* Release summary + new release button */}
        <div
          data-reveal
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Kpi label={t("kpi.total")} value={summary.total} />
          <Kpi
            label={t("kpi.security")}
            value={summary.security}
            accent={RELEASE_TYPE_COLOR.security}
          />
          <Kpi label={t("kpi.cvesFixed")} value={summary.cves} accent="#16A34A" />
          <Kpi
            label={t("kpi.latest")}
            value={summary.latest ? summary.latest.version : "—"}
            text
          />
        </div>

        {/* Releases list */}
        <div data-reveal>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("list.title")}</h2>
            {canWrite && (
              <Button size="sm" onClick={() => setNewOpen(true)}>
                <HugeIcon name="plus-sign-square-stroke-rounded" size={14} />
                {t("new.cta")}
              </Button>
            )}
          </div>
          {releases.length === 0 ? (
            <div
              className="overflow-hidden rounded-2xl bg-cover bg-center px-6 py-20 text-center"
              style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-black/25">
                <HugeIcon name="package" size={28} className="text-white/90" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">
                {t("empty.title")}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
              <div className="divide-y divide-white/[0.04]">
                {releases.map((r) => (
                  <ReleaseRow
                    key={r.id}
                    release={r}
                    canWrite={canWrite}
                    tType={(k) => t(`type.${k}`)}
                    tDelete={t("list.delete")}
                    tCvesFixed={t("list.cvesFixed")}
                    tSignedDigest={t("list.signedDigest")}
                    onDelete={() => {
                      startDelete(r.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </StaggerReveal>

      <NewReleaseDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={async (input) => {
          const res = await createRelease(productId, input);
          if (res.error || !res.id) {
            toast({ type: "error", message: t("toast.createFailed") });
            return false;
          }
          toast({ type: "success", message: t("toast.created") });
          // Re-fetch would be ideal; prepend locally to keep it snappy.
          setReleases((prev) => [
            {
              id: res.id!,
              product_id: productId,
              version: input.version,
              released_at:
                input.released_at ?? new Date().toISOString().slice(0, 10),
              release_type: input.release_type ?? "security",
              cves_fixed: input.cves_fixed ?? [],
              release_notes: input.release_notes ?? null,
              signed_digest: input.signed_digest ?? null,
              is_security_update:
                input.is_security_update ??
                (input.release_type === "security" ||
                  (input.cves_fixed?.length ?? 0) > 0),
              created_by: null,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          return true;
        }}
      />
    </div>
  );

  function startDelete(releaseId: string) {
    if (!confirm(t("list.confirmDelete"))) return;
    setReleases((prev) => prev.filter((r) => r.id !== releaseId));
    deleteRelease(releaseId, productId).then((res) => {
      if (res.error) {
        toast({ type: "error", message: t("toast.deleteFailed") });
      } else {
        toast({ type: "success", message: t("toast.deleted") });
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Kpi({
  label,
  value,
  accent,
  text,
}: {
  label: string;
  value: string | number;
  accent?: string;
  text?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-bold tracking-tight",
          text ? "text-base" : "text-2xl tabular-nums",
        )}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function SupportField({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  onSave,
}: {
  label: string;
  value: string;
  type?: "text" | "date";
  placeholder?: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground/70">
        {label}
      </label>
      <Input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onSave(local);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1.5"
      />
    </div>
  );
}

function ReleaseRow({
  release,
  canWrite,
  tType,
  tDelete,
  tCvesFixed,
  tSignedDigest,
  onDelete,
}: {
  release: ProductRelease;
  canWrite: boolean;
  tType: (key: string) => string;
  tDelete: string;
  tCvesFixed: string;
  tSignedDigest: string;
  onDelete: () => void;
}) {
  const { formatDate } = useLocaleDate();
  const color = RELEASE_TYPE_COLOR[release.release_type];
  return (
    <div className="relative flex items-start gap-4 px-5 py-4">
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: color }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {tType(release.release_type)}
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">
            v{release.version}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {formatDate(release.released_at)}
          </span>
          {release.is_security_update && release.cves_fixed.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#16A34A]">
              {tCvesFixed}: {release.cves_fixed.length}
            </span>
          )}
        </div>
        {release.release_notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground/80">
            {release.release_notes}
          </p>
        )}
        {release.cves_fixed.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {release.cves_fixed.map((cve) => (
              <span
                key={cve}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {cve}
              </span>
            ))}
          </div>
        )}
        {release.signed_digest && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/50">
            {tSignedDigest}: {release.signed_digest.slice(0, 32)}
            {release.signed_digest.length > 32 ? "…" : ""}
          </p>
        )}
      </div>
      {canWrite && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={tDelete}
        >
          <HugeIcon
            name="circle-stroke-rounded"
            size={14}
            className="text-muted-foreground"
          />
        </Button>
      )}
    </div>
  );
}

function NewReleaseDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    version: string;
    released_at?: string;
    release_type?: ReleaseType;
    cves_fixed?: string[];
    release_notes?: string;
    signed_digest?: string;
    is_security_update?: boolean;
  }) => Promise<boolean>;
}) {
  const t = useTranslations("releases");
  const [version, setVersion] = useState("");
  const [releasedAt, setReleasedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [type, setType] = useState<ReleaseType>("security");
  const [cves, setCves] = useState("");
  const [notes, setNotes] = useState("");
  const [digest, setDigest] = useState("");
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
      disabled={!version.trim()}
      onConfirm={() => {
        startTransition(async () => {
          const ok = await onCreate({
            version,
            released_at: releasedAt,
            release_type: type,
            cves_fixed: cves
              .split(/[,\s]+/)
              .map((s) => s.trim())
              .filter(Boolean),
            release_notes: notes.trim() || undefined,
            signed_digest: digest.trim() || undefined,
            is_security_update:
              type === "security" ||
              cves
                .split(/[,\s]+/)
                .map((s) => s.trim())
                .filter(Boolean).length > 0,
          });
          if (ok) {
            setVersion("");
            setCves("");
            setNotes("");
            setDigest("");
            setType("security");
            onClose();
          }
        });
      }}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t("new.versionLabel")}
            </label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.2.3"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t("new.releasedAtLabel")}
            </label>
            <Input
              type="date"
              value={releasedAt}
              onChange={(e) => setReleasedAt(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.typeLabel")}
          </label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {(["security", "bugfix", "feature", "maintenance"] as ReleaseType[]).map(
              (ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setType(ty)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                    type === ty
                      ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  style={{ ["--c" as string]: RELEASE_TYPE_COLOR[ty] }}
                >
                  {t(`type.${ty}`)}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.cvesLabel")}
          </label>
          <Input
            value={cves}
            onChange={(e) => setCves(e.target.value)}
            placeholder={t("new.cvesPlaceholder")}
            className="mt-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.notesLabel")}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("new.notesPlaceholder")}
            className="mt-1.5 min-h-20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("new.digestLabel")}
          </label>
          <Input
            value={digest}
            onChange={(e) => setDigest(e.target.value)}
            placeholder={t("new.digestPlaceholder")}
            className="mt-1.5 font-mono text-xs"
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
