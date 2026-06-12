"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { useToast } from "@/components/ui/toast";
import { CE_LOCATIONS, simplifiedDocPath } from "./constants";
import {
  saveIdentity,
  setPublicDoc,
  type IdentityState,
} from "./actions";

export function IdentityContent({
  productId,
  initial,
}: {
  productId: string;
  initial: IdentityState;
}) {
  const t = useTranslations("identity");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);

  const editable = initial.canWrite;
  const [form, setForm] = useState(() => ({
    ...initial.identity,
    ...initial.ce,
    ce_locations: [...initial.ce.ce_locations] as string[],
  }));
  const [published, setPublished] = useState(initial.publicDocEnabled);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function toggleLocation(loc: string) {
    setForm((p) => ({
      ...p,
      ce_locations: p.ce_locations.includes(loc)
        ? p.ce_locations.filter((l) => l !== loc)
        : [...p.ce_locations, loc],
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveIdentity(productId, {
        model_number: form.model_number,
        batch_number: form.batch_number,
        serial_number: form.serial_number,
        known_risks: form.known_risks,
        notified_body_certificate: form.notified_body_certificate,
        ce_affixed_at: form.ce_affixed_at,
        ce_locations: form.ce_locations,
        ce_notes: form.ce_notes,
      });
      toast(
        res.error
          ? { type: "error", message: t("errors.generic") }
          : { type: "success", message: t("feedback.saved") },
      );
      if (!res.error) router.refresh();
    });
  }

  function handleTogglePublish() {
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      const res = await setPublicDoc(productId, next);
      if (res.error) {
        setPublished(!next);
        toast({ type: "error", message: t("errors.generic") });
      } else {
        toast({
          type: "success",
          message: next ? t("simplified.published") : t("simplified.unpublished"),
        });
        router.refresh();
      }
    });
  }

  async function handleGenerateEndUserInfo() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/products/${productId}/end-user-info`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `end-user-information-${productId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ type: "error", message: t("annexII.generateFailed") });
    } finally {
      setGenerating(false);
    }
  }

  const canPublish = initial.orgPublicEnabled && !!initial.orgSlug;
  const publicUrl =
    canPublish && initial.orgSlug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}${simplifiedDocPath(initial.orgSlug, productId)}`
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h3 text-foreground">{t("title")}</h2>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {editable && (
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? t("actions.saving") : t("actions.save")}
          </Button>
        )}
      </div>

      {/* Product identification (Art 13(15),(16)) */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-[17px]">
        <div>
          <h3 className="text-h4 text-foreground">{t("identity.heading")}</h3>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            {t("identity.description")}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {(["model_number", "batch_number", "serial_number"] as const).map(
            (key) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{t(`identity.${key}`)}</Label>
                <Input
                  id={key}
                  disabled={!editable}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={t(`identity.${key}Placeholder`)}
                />
              </div>
            ),
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notified_body_certificate">
            {t("identity.notifiedBodyCertificate")}
          </Label>
          <Input
            id="notified_body_certificate"
            disabled={!editable}
            value={form.notified_body_certificate}
            onChange={(e) => set("notified_body_certificate", e.target.value)}
            placeholder={t("identity.notifiedBodyCertificatePlaceholder")}
          />
          <p className="text-p4 text-muted-foreground">
            {t("identity.notifiedBodyCertificateNote")}
          </p>
        </div>

        {/* Manufacturer block — from the org entity, display-only here. */}
        <div className="rounded-md bg-muted p-4">
          <p className="text-l6-plus uppercase tracking-wide text-muted-foreground">
            {t("identity.manufacturer")}
          </p>
          <p className="mt-1 text-p3 text-foreground">
            {initial.manufacturer.name || "—"}
          </p>
          <p className="text-p3 text-muted-foreground">
            {initial.manufacturer.address || "—"}
            {initial.manufacturer.contact
              ? ` · ${initial.manufacturer.contact}`
              : ""}
          </p>
          <p className="mt-1 text-p4 text-muted-foreground">
            {t("identity.manufacturerNote")}
          </p>
        </div>
      </section>

      {/* CE marking (Art 30) */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-[17px]">
        <div>
          <h3 className="flex items-center gap-2 text-h4 text-foreground">
            {t("ce.heading")}
            <FieldHelp
              title={t("ce.help.title")}
              body={t("ce.help.body")}
              reference={t("ce.help.ref")}
            />
          </h3>
          <p className="mt-0.5 text-p3 text-muted-foreground">
            {t("ce.description")}
          </p>
        </div>
        <div>
          <Label>{t("ce.locations")}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CE_LOCATIONS.map((loc) => {
              const on = form.ce_locations.includes(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  disabled={!editable}
                  onClick={() => toggleLocation(loc)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-l6 transition-colors disabled:cursor-not-allowed",
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`ce.location.${loc}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ce_affixed_at">{t("ce.affixedAt")}</Label>
            <Input
              id="ce_affixed_at"
              type="date"
              disabled={!editable}
              value={form.ce_affixed_at ?? ""}
              onChange={(e) => set("ce_affixed_at", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce_notes">{t("ce.notes")}</Label>
            <Input
              id="ce_notes"
              disabled={!editable}
              value={form.ce_notes}
              onChange={(e) => set("ce_notes", e.target.value)}
              placeholder={t("ce.notesPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* Simplified DoC (Annex VI) */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-[17px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-h4 text-foreground">
              {t("simplified.heading")}
              <FieldHelp
                title={t("simplified.help.title")}
                body={t("simplified.help.body")}
                reference={t("simplified.help.ref")}
              />
            </h3>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("simplified.description")}
            </p>
          </div>
          {editable && canPublish && (
            <Button
              size="sm"
              variant={published ? "outline" : "default"}
              onClick={handleTogglePublish}
              disabled={isPending}
            >
              {published ? t("simplified.unpublish") : t("simplified.publish")}
            </Button>
          )}
        </div>

        {!canPublish ? (
          <p className="rounded-md bg-warning/10 px-4 py-3 text-p3 text-warning">
            {t("simplified.needsPublicPages")}
          </p>
        ) : published && publicUrl ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-4 py-3">
            <Icon name="Link1" size={16} className="text-primary" />
            <code className="min-w-0 flex-1 truncate text-p3 text-foreground">
              {publicUrl}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(publicUrl)
                  .then(() =>
                    toast({ type: "success", message: t("simplified.copied") }),
                  )
                  .catch(() => {});
              }}
            >
              {t("simplified.copy")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={
                <a
                  href={simplifiedDocPath(initial.orgSlug!, productId)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              {t("simplified.open")}
            </Button>
          </div>
        ) : (
          <p className="text-p3 text-muted-foreground">
            {t("simplified.notPublished")}
          </p>
        )}
      </section>

      {/* End-user information (Annex II) */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-[17px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h4 text-foreground">{t("annexII.heading")}</h3>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("annexII.description")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateEndUserInfo}
            disabled={generating}
          >
            <Icon name="pdf-01-stroke-rounded" size={16} />
            {generating ? t("annexII.generating") : t("annexII.generate")}
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="known_risks">{t("annexII.knownRisks")}</Label>
          <Textarea
            id="known_risks"
            rows={3}
            disabled={!editable}
            value={form.known_risks}
            onChange={(e) => set("known_risks", e.target.value)}
            placeholder={t("annexII.knownRisksPlaceholder")}
          />
        </div>
        <div className="rounded-md bg-muted p-4">
          <p className="text-l6-plus uppercase tracking-wide text-muted-foreground">
            {t("annexII.supportEnd")}
          </p>
          <p className="mt-1 text-p3 text-foreground">
            {initial.supportPeriodEnd
              ? new Date(initial.supportPeriodEnd).toLocaleDateString()
              : t("annexII.supportEndUnset")}
          </p>
        </div>
      </section>
    </div>
  );
}
