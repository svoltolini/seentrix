"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { StaggerReveal } from "@/components/stagger-reveal";
import { StatCard } from "@/components/stat-card";
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
  security: "var(--destructive)",
  bugfix: "var(--warning)",
  feature: "var(--primary)",
  maintenance: "var(--muted-foreground)",
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
    if (days < 0) return { key: "outOfSupport", days, color: "var(--destructive)" };
    if (days < 90)
      return { key: "expiringSoon", days, color: "var(--warning)" };
    return { key: "inSupport", days, color: "var(--success)" };
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
          className="overflow-hidden rounded-md bg-card p-6 shadow-card-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-h4 text-foreground">{t("support.title")}</h2>
              <p className="mt-1 text-p3 text-muted-foreground">
                {t("support.description")}
              </p>
            </div>
            {supportStatus && (
              <span
                className="rounded-sm border px-3 py-1 text-l6"
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
              help={
                <FieldHelp
                  title={t("support.tooltips.start.title")}
                  body={t("support.tooltips.start.body")}
                  reference={t("support.tooltips.start.ref")}
                />
              }
              value={support.support_period_start ?? ""}
              type="date"
              disabled={!canWrite}
              onSave={(v) => handleSupportSave({ support_period_start: v || null })}
            />
            <SupportField
              label={t("support.endLabel")}
              help={
                <FieldHelp
                  title={t("support.tooltips.end.title")}
                  body={t("support.tooltips.end.body")}
                  reference={t("support.tooltips.end.ref")}
                />
              }
              value={support.support_period_end ?? ""}
              type="date"
              disabled={!canWrite}
              onSave={(v) => handleSupportSave({ support_period_end: v || null })}
            />
            <SupportField
              label={t("support.updateChannelLabel")}
              help={
                <FieldHelp
                  title={t("support.tooltips.updateChannel.title")}
                  body={t("support.tooltips.updateChannel.body")}
                  reference={t("support.tooltips.updateChannel.ref")}
                />
              }
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
          <StatCard label={t("kpi.total")} from="#066DE6" to="#FF9E55">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {summary.total}
            </p>
          </StatCard>
          <StatCard label={t("kpi.security")} from="#E60019" to="#FF6D00">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {summary.security}
            </p>
          </StatCard>
          <StatCard label={t("kpi.cvesFixed")} from="#4CD964" to="#16A34A">
            <p className="mt-2 text-h2 tabular-nums tracking-tight text-foreground">
              {summary.cves}
            </p>
          </StatCard>
          <StatCard label={t("kpi.latest")} from="#FF6D00" to="#066DE6">
            <p className="mt-2 truncate text-h4 tracking-tight text-white">
              {summary.latest ? summary.latest.version : "—"}
            </p>
          </StatCard>
        </div>

        {/* Releases list */}
        <div data-reveal>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-h4 text-foreground">{t("list.title")}</h2>
            {canWrite && (
              <Button size="sm" onClick={() => setNewOpen(true)}>
                <Icon name="plus-sign-square-stroke-rounded" size={14} />
                {t("new.cta")}
              </Button>
            )}
          </div>
          {releases.length === 0 ? (
            <div className="overflow-hidden rounded-md bg-card shadow-card-md px-6 py-20 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                <Icon name="package" size={28} className="text-primary" />
              </div>
              <h2 className="mt-5 text-h4 text-foreground">
                {t("empty.title")}
              </h2>
              <p className="mt-2 text-p3 text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md bg-card shadow-card-md">
              <div className="divide-y divide-border">
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

function SupportField({
  label,
  help,
  value,
  type = "text",
  placeholder,
  disabled,
  onSave,
}: {
  label: string;
  help?: ReactNode;
  value: string;
  type?: "text" | "date";
  placeholder?: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const isDate = type === "date";
  return (
    <div>
      <label className="flex items-center gap-2 text-l6 text-muted-foreground">
        {label}
        {help}
      </label>
      <div className="relative mt-1.5">
        <Input
          type={type}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => {
            if (local !== value) onSave(local);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(isDate && "pl-9")}
        />
        {isDate && (
          <Icon
            name="calendar-03-stroke-rounded"
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
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
            className="rounded-sm px-1.5 py-0.5 text-l6-plus uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {tType(release.release_type)}
          </span>
          <span className="font-mono text-l6 text-foreground">
            v{release.version}
          </span>
          <span className="text-p4 text-muted-foreground">
            {formatDate(release.released_at)}
          </span>
          {release.is_security_update && release.cves_fixed.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-success/15 px-2 py-0.5 text-l6-plus uppercase tracking-wide text-success">
              {tCvesFixed}: {release.cves_fixed.length}
            </span>
          )}
        </div>
        {release.release_notes && (
          <p className="line-clamp-2 text-p3 text-muted-foreground">
            {release.release_notes}
          </p>
        )}
        {release.cves_fixed.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {release.cves_fixed.map((cve) => (
              <span
                key={cve}
                className="rounded-sm bg-muted px-2 py-0.5 font-mono text-l6-plus text-muted-foreground"
              >
                {cve}
              </span>
            ))}
          </div>
        )}
        {release.signed_digest && (
          <p className="mt-1 font-mono text-p4 text-muted-foreground">
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
          <Icon
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
  const tip = (key: string) => ({
    title: t(`new.tooltips.${key}.title`),
    body: t(`new.tooltips.${key}.body`),
    reference: t(`new.tooltips.${key}.ref`),
  });
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
            <label className="flex items-center gap-2 text-l6 text-muted-foreground">
              {t("new.versionLabel")}
              <FieldHelp {...tip("version")} />
            </label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.2.3"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-l6 text-muted-foreground">
              {t("new.releasedAtLabel")}
              <FieldHelp {...tip("releasedAt")} />
            </label>
            <div className="relative mt-1.5">
              <Input
                type="date"
                value={releasedAt}
                onChange={(e) => setReleasedAt(e.target.value)}
                className="pl-9"
              />
              <Icon
                name="calendar-03-stroke-rounded"
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.typeLabel")}
            <FieldHelp {...tip("type")} />
          </label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {(["security", "bugfix", "feature", "maintenance"] as ReleaseType[]).map(
              (ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setType(ty)}
                  className={cn(
                    "rounded-sm border-[1.5px] px-2 py-1.5 text-l6 transition-colors",
                    type === ty
                      ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                      : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
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
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.cvesLabel")}
            <FieldHelp {...tip("cves")} />
          </label>
          <Input
            value={cves}
            onChange={(e) => setCves(e.target.value)}
            placeholder={t("new.cvesPlaceholder")}
            className="mt-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.notesLabel")}
            <FieldHelp {...tip("notes")} />
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("new.notesPlaceholder")}
            className="mt-1.5 min-h-20"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-l6 text-muted-foreground">
            {t("new.digestLabel")}
            <FieldHelp {...tip("digest")} />
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
