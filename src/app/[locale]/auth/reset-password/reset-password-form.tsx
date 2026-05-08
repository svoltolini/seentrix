"use client";

import { useActionState, useTransition, useState, useMemo } from "react";
import { Icon } from "@/components/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { resetPassword, type AuthState } from "../actions";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const strengthColors = [
  "bg-muted",
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-success",
];

export function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction] = useActionState<AuthState, FormData>(
    resetPassword.bind(null, locale),
    undefined
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password", "");
  const strength = useMemo(
    () => getPasswordStrength(passwordValue),
    [passwordValue]
  );

  function onSubmit(data: ResetPasswordValues) {
    const formData = new FormData();
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);
    startTransition(() => formAction(formData));
  }

  const errorMessage = state?.error
    ? t.has(`errors.${state.error}`)
      ? t(`errors.${state.error}`)
      : state.error
    : null;

  return (
    <>
      <h1 className="text-center text-h3 text-foreground">
        {t("resetPassword.title")}
      </h1>
      <p className="mt-1.5 text-center text-p3 text-muted-foreground">
        {t("resetPassword.description")}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-5"
      >
        {errorMessage && (
          <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-p3 text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("fields.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Icon name="EyeOff" className="size-4" />
              ) : (
                <Icon name="Eye" className="size-4" />
              )}
            </button>
          </div>
          {passwordValue && (
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-200 ${
                    i < strength ? strengthColors[strength] : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-p4 text-muted-foreground">
            {t("fields.passwordRequirements")}
          </p>
          {errors.password && (
            <p className="text-p4 text-destructive">
              {t("errors.passwordTooShort")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">
            {t("resetPassword.confirmPassword")}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <Icon name="EyeOff" className="size-4" />
              ) : (
                <Icon name="Eye" className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-p4 text-destructive">
              {t("errors.passwordMismatch")}
            </p>
          )}
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? (
            <Icon name="Loader2" className="size-4 animate-spin" />
          ) : (
            t("resetPassword.submit")
          )}
        </Button>
      </form>
    </>
  );
}
