"use client";

import { useActionState, useTransition, useState } from "react";
import { Icon } from "@/components/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { login, type AuthState } from "../actions";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState<AuthState, FormData>(
    login,
    undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginValues) {
    const formData = new FormData();
    formData.set("email", data.email);
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
      <h1 className="text-center font-heading text-[30px] font-medium tracking-[-0.6px] text-foreground">
        {t("login.title")}
      </h1>
      <p className="mt-1.5 text-center text-p3 text-muted-foreground">
        {t("login.description")}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("fields.password")}</Label>
            <Link
              href="/auth/forgot-password"
              className="text-p4 text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          {errors.password && (
            <p className="text-p4 text-destructive">
              {t("errors.required")}
            </p>
          )}
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? (
            <Icon name="Loader2" className="size-4 animate-spin" />
          ) : (
            t("login.submit")
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-p3 text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          href="/auth/signup"
          className="text-foreground underline underline-offset-4"
        >
          {t("login.signupLink")}
        </Link>
      </div>
    </>
  );
}
