"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

import { forgotPassword, type AuthState } from "../actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<AuthState, FormData>(
    forgotPassword.bind(null, locale),
    undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(data: ForgotPasswordValues) {
    const formData = new FormData();
    formData.set("email", data.email);
    startTransition(() => formAction(formData));
  }

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}`)
      ? t(`errors.${state.error}`)
      : state.error
    : null;

  return (
    <>
      <h1 className="text-center font-heading text-xl font-semibold text-foreground">
        {t("forgotPassword.title")}
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {t("forgotPassword.description")}
      </p>

      <div className="mt-8">
        {state?.success ? (
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("forgotPassword.success")}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {errorMessage && (
              <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("fields.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {t("errors.invalidEmail")}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-1 w-full"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("forgotPassword.submit")
              )}
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("forgotPassword.backToLogin")}
        </Link>
      </div>
    </>
  );
}
