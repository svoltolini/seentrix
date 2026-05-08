"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/ui/toast";
import { Turnstile } from "@/components/turnstile";
import { cn } from "@/lib/utils";
import {
  submitPublicReport,
  type SeveritySuggestion,
} from "../../app/vulnerability-reports/actions";

const SEVERITIES: SeveritySuggestion[] = [
  "critical",
  "high",
  "medium",
  "low",
];
const SEVERITY_COLOR: Record<SeveritySuggestion, string> = {
  critical: "#DC2626",
  high: "#D97706",
  medium: "#066DE6",
  low: "#6B7280",
};

export function PublicSecurityPage({
  orgName,
  orgSlug,
  contactEmail,
  policy,
}: {
  orgName: string;
  orgSlug: string;
  contactEmail: string | null;
  policy: string | null;
}) {
  const t = useTranslations("publicSecurity");
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterHandle, setReporterHandle] = useState("");
  const [affectedProduct, setAffectedProduct] = useState("");
  const [severity, setSeverity] = useState<SeveritySuggestion | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitPublicReport({
        orgSlug,
        title,
        description,
        reporterName,
        reporterEmail,
        reporterHandle,
        affectedProduct,
        severity: severity ?? undefined,
        captchaToken: captchaToken ?? undefined,
      });
      if (res.error) {
        // Surface a more specific message for the captcha failure so a
        // researcher who just hit it knows to reload, not to refile.
        const message =
          res.error === "captchaFailed"
            ? t("form.captchaFailed")
            : t("form.submitFailed");
        toast({ type: "error", message });
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        {/* Hero */}
        <div
          className="overflow-hidden rounded-md bg-cover bg-center px-8 py-10"
          style={{ backgroundImage: "url('/images/empty-state-bg.png')" }}
        >
          <p className="text-l6-plus uppercase tracking-wider text-white">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-h1 leading-tight text-white">
            {t("title", { org: orgName })}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white">
            {t("subtitle")}
          </p>
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}?subject=[Security] `}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
            >
              <Icon name="lock-password-stroke-rounded" size={14} />
              {t("emailCta", { email: contactEmail })}
            </a>
          )}
        </div>

        {/* Disclosure policy */}
        {policy && (
          <section className="mt-6 rounded-md border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">
              {t("policyTitle")}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {policy}
            </p>
          </section>
        )}

        {/* Intake form */}
        <section className="mt-6 rounded-md border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">
            {t("form.title")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("form.description")}
          </p>

          {submitted ? (
            <div className="mt-6 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/10 p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#16A34A]/25">
                <Icon
                  name="checkmark-circle-01-stroke-rounded"
                  size={20}
                  className="text-[#16A34A]"
                />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#16A34A]">
                {t("form.successTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("form.successDescription")}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("form.titleLabel")} *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("form.titlePlaceholder")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("form.descriptionLabel")} *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("form.descriptionPlaceholder")}
                  className="mt-1.5 min-h-32"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("form.affectedProductLabel")}
                </label>
                <Input
                  value={affectedProduct}
                  onChange={(e) => setAffectedProduct(e.target.value)}
                  placeholder={t("form.affectedProductPlaceholder")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("form.severityLabel")}
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s === severity ? null : s)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                        severity === s
                          ? "border-[color:var(--c)] bg-[color:var(--c)]/10 text-[color:var(--c)]"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                      style={{ ["--c" as string]: SEVERITY_COLOR[s] }}
                    >
                      {t(`severity.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("form.reporterNameLabel")}
                  </label>
                  <Input
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("form.reporterEmailLabel")}
                  </label>
                  <Input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("form.reporterHandleLabel")}
                </label>
                <Input
                  value={reporterHandle}
                  onChange={(e) => setReporterHandle(e.target.value)}
                  placeholder={t("form.reporterHandlePlaceholder")}
                  className="mt-1.5"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("form.anonymousNote")}
              </p>
              <Turnstile onToken={setCaptchaToken} className="self-start" />
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || pending}
                className="w-full"
              >
                {pending ? t("form.submitting") : t("form.submit")}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
