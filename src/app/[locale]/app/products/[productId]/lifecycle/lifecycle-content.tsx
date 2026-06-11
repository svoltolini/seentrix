"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/ui/toast";
import {
  SUPPLY_RELATIONS,
  MONITORING_SOURCES,
  MONITORING_SEVERITIES,
  ADVISORY_SEVERITIES,
  TEST_TYPES,
} from "./constants";
import {
  saveLifecycleFields,
  markEosNotified,
  addSupplier,
  deleteSupplier,
  addMonitoringEntry,
  deleteMonitoringEntry,
  addAdvisory,
  deleteAdvisory,
  toggleAdvisoryPublic,
  addSecurityTest,
  deleteSecurityTest,
  exportLifecycleRegister,
  type LifecycleState,
} from "./actions";

const SELECT = cn(
  "h-9 rounded-md bg-input px-2 text-p3 text-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
);

export function LifecycleContent({
  productId,
  initial,
}: {
  productId: string;
  initial: LifecycleState;
}) {
  const t = useTranslations("lifecycle");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const editable = initial.canWrite;
  const [notes, setNotes] = useState({
    surveillanceNotes: initial.conformity.surveillanceNotes,
    correctiveActionProcedure: initial.correctiveActionProcedure,
    eosNotice: initial.eosNotice,
  });

  function refreshAfter(p: Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await p;
      if (res.error) toast({ type: "error", message: t("errors.generic") });
      else router.refresh();
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const res = await saveLifecycleFields(productId, notes);
      toast(
        res.error
          ? { type: "error", message: t("errors.generic") }
          : { type: "success", message: t("feedback.saved") },
      );
      if (!res.error) router.refresh();
    });
  }

  function handleExport() {
    startTransition(async () => {
      const res = await exportLifecycleRegister(productId);
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else toast({ type: "error", message: t("errors.generic") });
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h3 text-foreground">{t("title")}</h2>
          <p className="mt-0.5 max-w-2xl text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
            <Icon name="pdf-01-stroke-rounded" size={16} />
            {t("actions.export")}
          </Button>
          {editable && (
            <Button size="sm" onClick={handleSaveNotes} disabled={isPending}>
              {t("actions.saveNotes")}
            </Button>
          )}
        </div>
      </div>

      {/* 1. Conformity module & surveillance (Art 32 / Annex VIII) */}
      <Section heading={t("sections.conformity")} description={t("conformity.description")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Display label={t("conformity.route")} value={initial.conformity.route ? t(`routes.${initial.conformity.route}`) : "—"} />
          <Display
            label={t("conformity.notifiedBody")}
            value={[initial.conformity.nbName, initial.conformity.nbId].filter(Boolean).join(" · ") || "—"}
          />
        </div>
        <Field label={t("conformity.surveillance")}>
          <Textarea
            rows={2}
            disabled={!editable}
            value={notes.surveillanceNotes}
            onChange={(e) => setNotes((p) => ({ ...p, surveillanceNotes: e.target.value }))}
            placeholder={t("conformity.surveillancePlaceholder")}
          />
        </Field>
      </Section>

      {/* 2. Supply-chain register (Art 23) */}
      <Section heading={t("sections.supplyChain")} description={t("supply.description")}>
        <p className="rounded-md bg-muted px-3 py-2 text-p4 text-muted-foreground">
          {t("supply.retention")}
        </p>
        <RowList
          rows={initial.suppliers.map((s) => ({
            id: s.id,
            primary: `${t(`supply.${s.relation === "upstream_supplier" ? "upstream" : "downstream"}`)} · ${s.name}`,
            secondary: [s.entity_type, s.address, s.contact].filter(Boolean).join(" · "),
          }))}
          editable={editable}
          onDelete={(id) => refreshAfter(deleteSupplier(productId, id))}
          empty={t("supply.empty")}
        />
        {editable && (
          <SupplierForm
            t={t}
            onAdd={(input) => refreshAfter(addSupplier(productId, input))}
          />
        )}
      </Section>

      {/* 3. Post-market monitoring (Art 13(7)) */}
      <Section heading={t("sections.monitoring")} description={t("monitoring.description")}>
        <RowList
          rows={initial.monitoring.map((m) => ({
            id: m.id,
            primary: `${m.entry_date} · ${t(`sources.${m.source}`)}${m.severity ? ` · ${t(`severities.${m.severity}`)}` : ""}`,
            secondary: m.description,
          }))}
          editable={editable}
          onDelete={(id) => refreshAfter(deleteMonitoringEntry(productId, id))}
          empty={t("monitoring.empty")}
        />
        {editable && (
          <MonitoringForm
            t={t}
            onAdd={(input) => refreshAfter(addMonitoringEntry(productId, input))}
          />
        )}
      </Section>

      {/* 4. Vulnerability advisories (Annex I II.4) */}
      <Section heading={t("sections.advisories")} description={t("advisories.description")}>
        <div className="space-y-2">
          {initial.advisories.length === 0 ? (
            <p className="text-p3 text-muted-foreground">{t("advisories.empty")}</p>
          ) : (
            initial.advisories.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-p3 text-foreground">
                    {a.advisory_ref || a.cve_id ? `${a.advisory_ref || a.cve_id} — ` : ""}
                    {a.title}
                  </p>
                  <p className="text-p4 text-muted-foreground">
                    {[a.severity && t(`severities.${a.severity}`), a.fixed_version && `${t("advisories.fixed")} ${a.fixed_version}`, a.published_at]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {editable && (
                  <>
                    <button
                      type="button"
                      onClick={() => refreshAfter(toggleAdvisoryPublic(productId, a.id, !a.is_public))}
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-l6-plus uppercase tracking-wide",
                        a.is_public ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {a.is_public ? t("advisories.public") : t("advisories.private")}
                    </button>
                    <DeleteButton onClick={() => refreshAfter(deleteAdvisory(productId, a.id))} />
                  </>
                )}
              </div>
            ))
          )}
        </div>
        {editable && (
          <AdvisoryForm t={t} onAdd={(input) => refreshAfter(addAdvisory(productId, input))} />
        )}
      </Section>

      {/* 5. Recurring security tests (Annex I II.3) */}
      <Section heading={t("sections.securityTests")} description={t("tests.description")}>
        <RowList
          rows={initial.tests.map((te) => ({
            id: te.id,
            primary: `${t(`testTypes.${te.test_type}`)}${te.frequency_days ? ` · ${t("tests.everyDays", { n: te.frequency_days })}` : ""}`,
            secondary: [te.last_performed_at && `${t("tests.last")} ${te.last_performed_at}`, te.next_due && `${t("tests.next")} ${te.next_due}`, te.result]
              .filter(Boolean)
              .join(" · "),
          }))}
          editable={editable}
          onDelete={(id) => refreshAfter(deleteSecurityTest(productId, id))}
          empty={t("tests.empty")}
        />
        {editable && (
          <TestForm t={t} onAdd={(input) => refreshAfter(addSecurityTest(productId, input))} />
        )}
      </Section>

      {/* 6. End-of-support & corrective action (Art 13(19),(21)) */}
      <Section heading={t("sections.endOfSupport")} description={t("eos.description")}>
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-4 py-3">
          <span className="text-l6-plus uppercase tracking-wide text-muted-foreground">
            {t("eos.supportEnd")}
          </span>
          <span className="flex-1 text-p3 text-foreground">
            {initial.supportPeriodEnd ? new Date(initial.supportPeriodEnd).toLocaleDateString() : t("eos.unset")}
          </span>
          {initial.eosNotifiedAt ? (
            <span className="rounded-sm bg-success/10 px-2.5 py-1 text-l6-plus text-success">
              {t("eos.notified", { date: new Date(initial.eosNotifiedAt).toLocaleDateString() })}
            </span>
          ) : (
            editable && (
              <Button size="sm" variant="outline" onClick={() => refreshAfter(markEosNotified(productId))} disabled={isPending}>
                {t("eos.markNotified")}
              </Button>
            )
          )}
        </div>
        <Field label={t("eos.notice")}>
          <Textarea
            rows={2}
            disabled={!editable}
            value={notes.eosNotice}
            onChange={(e) => setNotes((p) => ({ ...p, eosNotice: e.target.value }))}
            placeholder={t("eos.noticePlaceholder")}
          />
        </Field>
        <Field label={t("eos.corrective")}>
          <Textarea
            rows={3}
            disabled={!editable}
            value={notes.correctiveActionProcedure}
            onChange={(e) => setNotes((p) => ({ ...p, correctiveActionProcedure: e.target.value }))}
            placeholder={t("eos.correctivePlaceholder")}
          />
        </Field>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Section({
  heading,
  description,
  children,
}: {
  heading: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-[17px]">
      <div>
        <h3 className="text-h4 text-foreground">{heading}</h3>
        <p className="mt-0.5 text-p3 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Display({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-l6-plus uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-p3 text-foreground">{value}</p>
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      aria-label="Delete"
    >
      <Icon name="delete-02-stroke-rounded" size={15} />
    </button>
  );
}

function RowList({
  rows,
  editable,
  onDelete,
  empty,
}: {
  rows: { id: string; primary: string; secondary: string }[];
  editable: boolean;
  onDelete: (id: string) => void;
  empty: string;
}) {
  if (rows.length === 0)
    return <p className="text-p3 text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-p3 text-foreground">{r.primary}</p>
            {r.secondary && <p className="text-p4 text-muted-foreground">{r.secondary}</p>}
          </div>
          {editable && <DeleteButton onClick={() => onDelete(r.id)} />}
        </div>
      ))}
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

function AddBar({ children, onAdd, label }: { children: ReactNode; onAdd: () => void; label: string }) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted p-3">
      {children}
      <Button type="button" size="sm" onClick={onAdd}>
        <Icon name="add-01-stroke-rounded" size={14} />
        {label}
      </Button>
    </div>
  );
}

function SupplierForm({ t, onAdd }: { t: T; onAdd: (i: { relation: string; entity_type: string; name: string; address: string; contact: string; notes: string }) => void }) {
  const empty = { relation: SUPPLY_RELATIONS[0] as string, entity_type: "", name: "", address: "", contact: "", notes: "" };
  const [f, setF] = useState(empty);
  return (
    <AddBar label={t("actions.add")} onAdd={() => { onAdd(f); setF(empty); }}>
      <select className={SELECT} value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>
        {SUPPLY_RELATIONS.map((r) => (
          <option key={r} value={r}>{t(`supply.${r === "upstream_supplier" ? "upstream" : "downstream"}`)}</option>
        ))}
      </select>
      <Input className="h-9 w-40" placeholder={t("supply.name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input className="h-9 w-48" placeholder={t("supply.address")} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      <Input className="h-9 w-40" placeholder={t("supply.contact")} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />
    </AddBar>
  );
}

function MonitoringForm({ t, onAdd }: { t: T; onAdd: (i: { entry_date: string; source: string; severity: string; description: string; link: string }) => void }) {
  const empty = { entry_date: "", source: MONITORING_SOURCES[0] as string, severity: "", description: "", link: "" };
  const [f, setF] = useState(empty);
  return (
    <AddBar label={t("actions.add")} onAdd={() => { onAdd(f); setF(empty); }}>
      <Input className="h-9 w-36" type="date" value={f.entry_date} onChange={(e) => setF({ ...f, entry_date: e.target.value })} />
      <select className={SELECT} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
        {MONITORING_SOURCES.map((s) => <option key={s} value={s}>{t(`sources.${s}`)}</option>)}
      </select>
      <select className={SELECT} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
        <option value="">{t("monitoring.noSeverity")}</option>
        {MONITORING_SEVERITIES.map((s) => <option key={s} value={s}>{t(`severities.${s}`)}</option>)}
      </select>
      <Input className="h-9 w-56" placeholder={t("monitoring.descriptionField")} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
    </AddBar>
  );
}

function AdvisoryForm({ t, onAdd }: { t: T; onAdd: (i: { advisory_ref: string; cve_id: string; title: string; summary: string; affected_versions: string; fixed_version: string; severity: string; published_at: string; is_public: boolean }) => void }) {
  const empty = { advisory_ref: "", cve_id: "", title: "", summary: "", affected_versions: "", fixed_version: "", severity: "", published_at: "", is_public: false };
  const [f, setF] = useState(empty);
  return (
    <AddBar label={t("actions.add")} onAdd={() => { onAdd(f); setF(empty); }}>
      <Input className="h-9 w-32" placeholder={t("advisories.ref")} value={f.advisory_ref} onChange={(e) => setF({ ...f, advisory_ref: e.target.value })} />
      <Input className="h-9 w-32" placeholder="CVE" value={f.cve_id} onChange={(e) => setF({ ...f, cve_id: e.target.value })} />
      <Input className="h-9 w-48" placeholder={t("advisories.title")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Input className="h-9 w-28" placeholder={t("advisories.fixed")} value={f.fixed_version} onChange={(e) => setF({ ...f, fixed_version: e.target.value })} />
      <select className={SELECT} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
        <option value="">{t("monitoring.noSeverity")}</option>
        {ADVISORY_SEVERITIES.map((s) => <option key={s} value={s}>{t(`severities.${s}`)}</option>)}
      </select>
      <Input className="h-9 w-36" type="date" value={f.published_at} onChange={(e) => setF({ ...f, published_at: e.target.value })} />
    </AddBar>
  );
}

function TestForm({ t, onAdd }: { t: T; onAdd: (i: { test_type: string; frequency_days: string; last_performed_at: string; next_due: string; result: string; notes: string }) => void }) {
  const empty = { test_type: TEST_TYPES[0] as string, frequency_days: "", last_performed_at: "", next_due: "", result: "", notes: "" };
  const [f, setF] = useState(empty);
  return (
    <AddBar label={t("actions.add")} onAdd={() => { onAdd(f); setF(empty); }}>
      <select className={SELECT} value={f.test_type} onChange={(e) => setF({ ...f, test_type: e.target.value })}>
        {TEST_TYPES.map((s) => <option key={s} value={s}>{t(`testTypes.${s}`)}</option>)}
      </select>
      <Input className="h-9 w-28" type="number" placeholder={t("tests.frequency")} value={f.frequency_days} onChange={(e) => setF({ ...f, frequency_days: e.target.value })} />
      <Input className="h-9 w-36" type="date" value={f.last_performed_at} onChange={(e) => setF({ ...f, last_performed_at: e.target.value })} />
      <Input className="h-9 w-44" placeholder={t("tests.result")} value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })} />
    </AddBar>
  );
}
