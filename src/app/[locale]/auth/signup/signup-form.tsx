"use client";

import { useActionState, useTransition, useState, useMemo } from "react";
import { Icon } from "@/components/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { signup, type AuthState } from "../actions";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
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

export function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState<AuthState, FormData>(
    signup.bind(null, locale),
    undefined
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch("password", "");
  const strength = useMemo(
    () => getPasswordStrength(passwordValue),
    [passwordValue]
  );

  function onSubmit(data: SignupValues) {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("fullName", data.fullName);
    formData.set("password", data.password);
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
        {t("signup.title")}
      </h1>
      <p className="mt-1.5 text-center text-p3 text-muted-foreground">
        {t("signup.description")}
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
          <Label htmlFor="fullName">{t("fields.fullName")}</Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t("fields.fullNamePlaceholder")}
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-p4 text-destructive">
              {t("errors.required")}
            </p>
          )}
        </div>

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
            <p className="text-p4 text-destructive">
              {t("errors.invalidEmail")}
            </p>
          )}
        </div>

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

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? (
            <Icon name="Loader2" className="size-4 animate-spin" />
          ) : (
            t("signup.submit")
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-p3 text-muted-foreground">
        {t("signup.hasAccount")}{" "}
        <Link
          href="/auth/login"
          className="text-foreground underline underline-offset-4"
        >
          {t("signup.loginLink")}
        </Link>
      </div>
    </>
  );
}
