"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/icon";
import { verifyCertificate, type CertificateVerification } from "./actions";
import type { LocaleId } from "@/lib/academy/types";

/**
 * CertificateVerify — admin / compliance-officer tool to confirm an Academy
 * certificate is genuine and see who it belongs to.
 *
 * Paste a certificate number (the truncated 16-char value shown on a lesson,
 * or the full 32-char hash) and we look it up within the org. A valid match
 * shows the holder, the lesson, the score and the completion date; anything
 * else returns a clear "not found" so a forged number can't be passed off as
 * real.
 */
export function CertificateVerify() {
  const t = useTranslations("academy.verify");
  const locale = useLocale() as LocaleId;
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hash = value.trim();
    if (!hash) return;
    startTransition(async () => {
      const res = await verifyCertificate(hash, locale);
      setResult(res);
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-md bg-card p-6 shadow-card-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon name="checkmark-badge-01-stroke-rounded" size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-h5 text-foreground">{t("title")}</h3>
            <p className="mt-1 text-p3 text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("placeholder")}
            className="font-mono"
            aria-label={t("title")}
          />
          <Button type="submit" disabled={isPending || !value.trim()}>
            {isPending ? t("checking") : t("verify")}
          </Button>
        </form>
      </div>

      {result && (
        <div className="mt-4">
          <ResultCard result={result} t={t} />
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  t,
}: {
  result: CertificateVerification;
  t: ReturnType<typeof useTranslations>;
}) {
  if (result.status === "valid") {
    const rows: { label: string; value: string }[] = [
      { label: t("holder"), value: result.holderName },
      { label: t("email"), value: result.holderEmail },
      { label: t("lesson"), value: result.lessonTitle },
      {
        label: t("score"),
        value: `${Math.round(result.score * 100)}%`,
      },
      {
        label: t("completedAt"),
        value: new Date(result.completedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    ];
    return (
      <div className="overflow-hidden rounded-md border-[1.5px] border-success/30 bg-success/5">
        <div className="flex items-center gap-2.5 border-b border-success/20 px-5 py-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="checkmark-circle-01-stroke-rounded" size={16} />
          </span>
          <p className="text-h6 text-foreground">{t("validTitle")}</p>
        </div>
        <dl className="divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-4 px-5 py-2.5"
            >
              <dt className="text-l6-plus uppercase tracking-wide text-muted-foreground">
                {r.label}
              </dt>
              <dd className="min-w-0 truncate text-right text-p3 text-foreground">
                {r.value}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 px-5 py-2.5">
            <dt className="text-l6-plus uppercase tracking-wide text-muted-foreground">
              {t("certificate")}
            </dt>
            <dd className="min-w-0 truncate text-right font-mono text-p4 text-muted-foreground">
              {result.certificateHash}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  const message =
    result.status === "not_found"
      ? t("notFound")
      : result.status === "forbidden"
        ? t("forbidden")
        : t("error");

  return (
    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-5 py-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <Icon name="alert-02" size={16} />
      </span>
      <p className="text-p3 text-foreground">{message}</p>
    </div>
  );
}
