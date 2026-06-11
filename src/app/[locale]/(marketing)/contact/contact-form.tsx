"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Turnstile } from "@/components/turnstile";
import { submitContactEnquiry, type ContactState } from "./actions";

/**
 * Custom-plan / Enterprise contact form. Same uncontrolled-form +
 * useActionState + Turnstile pattern as the landing newsletter, so the
 * server action owns all validation/anti-spam and the client stays thin.
 */
export function ContactForm() {
  const t = useTranslations("contact.form");
  const tc = useTranslations("common");
  const [state, action, isPending] = useActionState<ContactState, FormData>(
    submitContactEnquiry,
    undefined,
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const succeeded = state?.status === "success";

  if (succeeded) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-14 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="TickCircle" size={24} variant="Bold" aria-hidden="true" />
        </span>
        <p className="max-w-sm text-[15px] leading-relaxed text-foreground">
          {t("success")}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">{t("nameLabel")}</Label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder={t("namePlaceholder")}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">{t("emailLabel")}</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder={t("emailPlaceholder")}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-company">{t("companyLabel")}</Label>
          <Input
            id="contact-company"
            name="company"
            type="text"
            maxLength={160}
            placeholder={t("companyPlaceholder")}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-products">{t("productsLabel")}</Label>
          <Input
            id="contact-products"
            name="products"
            type="text"
            inputMode="numeric"
            maxLength={40}
            placeholder={t("productsPlaceholder")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">{t("messageLabel")}</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder={t("messagePlaceholder")}
          disabled={isPending}
        />
      </div>

      {/* Turnstile token forwarded as a hidden field; widget renders below. */}
      <input
        type="hidden"
        name="cf-turnstile-response"
        value={captchaToken ?? ""}
      />
      <div className="flex justify-start">
        <Turnstile onToken={setCaptchaToken} label={tc("securityCheck")} />
      </div>

      {state?.status === "error" && (
        <p className="text-p3 text-destructive" role="alert">
          {t("error")}
        </p>
      )}
      {state?.status === "rate_limited" && (
        <p className="text-p3 text-warning" role="alert">
          {t("rateLimited")}
        </p>
      )}
      {state?.status === "captcha_failed" && (
        <p className="text-p3 text-destructive" role="alert">
          {t("captchaFailed")}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-p4-r text-muted-foreground">{t("privacy")}</p>
        <Button
          type="submit"
          size="lg"
          className="w-full shrink-0 sm:w-auto"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Icon name="Loader2" className="size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </div>
    </form>
  );
}
