"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { HugeIcon } from "@/components/huge-icon";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import {
  setObligationStatus,
  updateEntityType,
  type EntityState,
  type EntityType,
  type ObligationStatus,
} from "./actions";

const ENTITY_ORDER: EntityType[] = [
  "manufacturer",
  "authorised_representative",
  "importer",
  "distributor",
];

const STATUS_COLOR: Record<ObligationStatus, string> = {
  pending: "#6B7280",
  in_progress: "#D97706",
  complete: "#16A34A",
  not_applicable: "#6B7280",
};

const ENTITY_ICON: Record<EntityType, string> = {
  manufacturer: "circuit-board-stroke-rounded",
  authorised_representative: "crown-stroke-rounded",
  importer: "package",
  distributor: "package-open-stroke-rounded",
};

export function EntityContent({
  initial,
  currentUserRole,
}: {
  initial: EntityState;
  currentUserRole: string | null;
}) {
  const t = useTranslations("entity");
  const tType = useTranslations("entity.type");
  const tStatus = useTranslations("entity.status");
  const { toast } = useToast();
  const [state, setState] = useState(initial);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const canEdit =
    currentUserRole === "admin" || currentUserRole === "compliance_officer";

  const progress = useMemo(() => {
    const total = state.obligations.filter(
      (o) => o.status !== "not_applicable",
    ).length;
    const done = state.obligations.filter((o) => o.status === "complete").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [state.obligations]);

  async function handleTypeChange(next: EntityType) {
    if (next === state.entityType) return;
    startTransition(async () => {
      const res = await updateEntityType(next);
      if (res.error) {
        toast({ type: "error", message: t("toast.saveFailed") });
      } else {
        // Full page reload to re-seed obligation rows server-side.
        window.location.reload();
      }
    });
  }

  async function applyStatus(
    key: string,
    status: ObligationStatus,
    notes?: string,
  ) {
    setState((prev) => ({
      ...prev,
      obligations: prev.obligations.map((o) =>
        o.key === key
          ? {
              ...o,
              status,
              notes: notes ?? o.notes,
              completed_at:
                status === "complete" ? new Date().toISOString() : null,
            }
          : o,
      ),
    }));
    const res = await setObligationStatus(key, status, notes);
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
        <div data-reveal>
          <h1 className="font-heading text-[22px] font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Entity-type picker */}
        <div
          data-reveal
          className="rounded-2xl border border-white/[0.06] bg-card p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{t("type.title")}</h2>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("type.description")}
              </p>
            </div>
            <ProgressRing value={progress} label={t("progressLabel")} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {ENTITY_ORDER.map((ty) => {
              const active = state.entityType === ty;
              return (
                <button
                  key={ty}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleTypeChange(ty)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-white/[0.06] hover:border-white/[0.12]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      active ? "bg-primary/15" : "bg-white/[0.04]",
                    )}
                  >
                    <HugeIcon
                      name={ENTITY_ICON[ty]}
                      size={18}
                      className={active ? "text-primary" : "text-muted-foreground"}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {tType(`${ty}.title`)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {tType(`${ty}.description`)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Obligations list */}
        <div
          data-reveal
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
        >
          <div className="border-b border-white/[0.06] px-5 py-3">
            <span className="text-sm font-semibold">
              {t("obligations.title", { entity: tType(`${state.entityType}.title`) })}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {state.obligations.map((ob) => {
              const color = STATUS_COLOR[ob.status];
              const expanded = expandedKey === ob.key;
              return (
                <div key={ob.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKey((prev) => (prev === ob.key ? null : ob.key))
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: color,
                        backgroundColor:
                          ob.status === "complete" ? color : "transparent",
                      }}
                    >
                      {ob.status === "complete" && (
                        <HugeIcon
                          name="checkmark-circle-01-stroke-rounded"
                          size={12}
                          className="text-white"
                        />
                      )}
                      {ob.status === "in_progress" && (
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {t(`obligation.${state.entityType}.${ob.key}.title`)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                        {t(`obligation.${state.entityType}.${ob.key}.description`)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                    >
                      {tStatus(ob.status)}
                    </span>
                    <HugeIcon
                      name="arrow-right-01-stroke-rounded"
                      size={14}
                      className={cn(
                        "text-muted-foreground/40 transition-transform",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded && canEdit && (
                    <div className="border-t border-white/[0.04] bg-white/[0.015] px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            "pending",
                            "in_progress",
                            "complete",
                            "not_applicable",
                          ] as ObligationStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => applyStatus(ob.key, st, ob.notes ?? undefined)}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                              ob.status === st
                                ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                                : "border-border text-muted-foreground hover:text-foreground",
                            )}
                            style={{ ["--c" as string]: STATUS_COLOR[st] }}
                          >
                            {tStatus(st)}
                          </button>
                        ))}
                      </div>
                      <NotesField
                        initial={ob.notes ?? ""}
                        placeholder={t("obligations.notesPlaceholder")}
                        label={t("obligations.notesLabel")}
                        onSave={(value) => applyStatus(ob.key, ob.status, value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </StaggerReveal>
    </div>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const SIZE = 72;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - value / 100);
  const color = value >= 100 ? "#16A34A" : value >= 50 ? "#D97706" : "#2563EB";
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeOpacity="0.25"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {value}%
          </span>
        </div>
      </div>
      <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}

function NotesField({
  initial,
  placeholder,
  label,
  onSave,
}: {
  initial: string;
  placeholder: string;
  label: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(initial);
  return (
    <div className="mt-3">
      <label className="text-xs font-medium text-muted-foreground/70">
        {label}
      </label>
      <Textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initial) onSave(local);
        }}
        placeholder={placeholder}
        className="mt-1.5 min-h-20"
      />
    </div>
  );
}
