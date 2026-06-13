"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { StaggerReveal } from "@/components/stagger-reveal";
import { useToast } from "@/components/ui/toast";
import { ReferenceCard, ReferenceBadge } from "@/components/reference-card";
import { FieldHelp } from "@/components/field-help";
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
  "open_source_software_steward",
];

const STATUS_COLOR: Record<ObligationStatus, string> = {
  pending: "var(--muted-foreground)",
  in_progress: "var(--warning)",
  complete: "var(--success)",
  not_applicable: "var(--muted-foreground)",
};

const ENTITY_ICON: Record<EntityType, string> = {
  manufacturer: "circuit-board-stroke-rounded",
  authorised_representative: "crown-stroke-rounded",
  importer: "package",
  distributor: "package-open-stroke-rounded",
  open_source_software_steward: "terminal-stroke-rounded",
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
        className="space-y-[18px]"
        selector="[data-reveal]"
        stagger={0.08}
        y={24}
        duration={0.7}
        scale={0.98}
        ease="power3.out"
      >
        <div data-reveal>
          <h1 className="text-h1 text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Role hero — contents span the full card width; progress is a
            horizontal bar (no circle), matching the Academy hero. */}
        <ReferenceCard data-reveal className="p-6 md:p-8">
          <ReferenceBadge className="mb-3">
            <span
              className={cn(
                "size-1.5 rounded-full",
                progress === 100 ? "bg-success" : "animate-pulse bg-warning",
              )}
            />
            {t("progressLabel")}
          </ReferenceBadge>
          <h2 className="text-h3 leading-snug text-white">
            {t("type.title")}
          </h2>
          <p className="mt-2 text-p3 text-white/80">
            {t("type.description")}
          </p>
          <div className="mt-5 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-end">
              <span className="text-p4 tabular-nums text-white/70">
                {progress}%
              </span>
            </div>
          </div>
        </ReferenceCard>

        {/* Role selector — OUTSIDE the reference card, on normal card
            surfaces with the rounded-square filled IconBadge treatment. */}
        <div data-reveal className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ENTITY_ORDER.map((ty) => {
              const active = state.entityType === ty;
              return (
                <button
                  key={ty}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleTypeChange(ty)}
                  className={cn(
                    "group flex items-start gap-3.5 rounded-md border-[1.5px] border border-border bg-card p-4 text-left transition-all",
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border-outline hover:-translate-y-0.5 hover:border-primary/25",
                    !canEdit && "cursor-not-allowed opacity-70",
                  )}
                >
                  <IconBadge
                    name={ENTITY_ICON[ty]}
                    tone={active ? "primary" : "muted"}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-h5 text-foreground">
                        {tType(`${ty}.title`)}
                      </p>
                      {active && (
                        <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wide text-primary">
                          {t("type.current")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-p3-r leading-relaxed text-muted-foreground">
                      {tType(`${ty}.description`)}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Obligations list */}
        <div
          data-reveal
          className="overflow-hidden rounded-md bg-muted"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <span className="text-h4 text-foreground">
              {t("obligations.title", { entity: tType(`${state.entityType}.title`) })}
            </span>
            {(state.entityType === "manufacturer" ||
              state.entityType === "authorised_representative") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = "/api/org/ar-mandate";
                  a.rel = "noopener";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                title={t("mandate.hint")}
              >
                <Icon name="DocumentDownload" size={14} />
                {t("mandate.generate")}
              </Button>
            )}
          </div>
          <div className="divide-y divide-border">
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
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60"
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
                        <Icon
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
                      <span className="flex items-center gap-1.5">
                        <p className="text-l6 text-foreground">
                          {t(`obligation.${state.entityType}.${ob.key}.title`)}
                        </p>
                        {t.has(
                          `obligation.${state.entityType}.${ob.key}.help.title`,
                        ) && (
                          <span
                            // Stop the row's expand/collapse toggle from firing
                            // when the user opens the help sheet.
                            onClick={(e) => e.stopPropagation()}
                            role="presentation"
                          >
                            <FieldHelp
                              title={t(
                                `obligation.${state.entityType}.${ob.key}.help.title`,
                              )}
                              body={t(
                                `obligation.${state.entityType}.${ob.key}.help.body`,
                              )}
                              reference={
                                t.has(
                                  `obligation.${state.entityType}.${ob.key}.help.ref`,
                                )
                                  ? t(
                                      `obligation.${state.entityType}.${ob.key}.help.ref`,
                                    )
                                  : undefined
                              }
                            />
                          </span>
                        )}
                      </span>
                      <p className="mt-0.5 text-p4 text-muted-foreground">
                        {t(`obligation.${state.entityType}.${ob.key}.description`)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-sm px-2.5 py-0.5 text-l6-plus"
                      style={{
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                    >
                      {tStatus(ob.status)}
                    </span>
                    <Icon
                      name="arrow-right-01-stroke-rounded"
                      size={14}
                      className={cn(
                        "text-muted-foreground transition-transform",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded && canEdit && (
                    <div className="border-t border-border bg-muted px-5 py-5">
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
                              "rounded-sm border-[1.5px] px-3 py-1.5 text-l6-plus transition-colors",
                              ob.status === st
                                ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                                : "border-border-outline bg-card text-muted-foreground hover:text-foreground",
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
      <label className="text-l6-plus uppercase tracking-[1.5px] text-muted-foreground">
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
