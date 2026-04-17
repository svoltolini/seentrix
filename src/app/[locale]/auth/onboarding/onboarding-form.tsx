"use client";

import { useActionState, useTransition, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Camera } from "lucide-react";
import Image from "next/image";

import { completeOnboarding, type AuthState } from "../actions";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<AuthState, FormData>(
    completeOnboarding.bind(null, locale),
    undefined
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarFileRef.current = file;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onSubmit(data: OnboardingValues) {
    const formData = new FormData();
    formData.set("organizationName", data.organizationName);
    if (avatarFileRef.current) {
      formData.set("avatar", avatarFileRef.current);
    }
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
        {t("onboarding.title")}
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {t("onboarding.description")}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-5"
      >
        {errorMessage && (
          <p className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted transition-colors hover:bg-muted/80"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            ) : (
              <Camera className="size-6 text-muted-foreground" />
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-[11px] text-muted-foreground/60">
            {t("onboarding.avatarHint")}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationName">
            {t("fields.organizationName")}
          </Label>
          <Input
            id="organizationName"
            type="text"
            placeholder={t("fields.organizationNamePlaceholder")}
            aria-invalid={!!errors.organizationName}
            {...register("organizationName")}
          />
          {errors.organizationName && (
            <p className="text-xs text-destructive">
              {t("errors.required")}
            </p>
          )}
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            t("onboarding.submit")
          )}
        </Button>
      </form>
    </>
  );
}
