"use client";

import { useState, useTransition, useRef } from "react";
import { Icon } from "@/components/icon";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "@/components/language-picker";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, changePassword, type AccountInfo } from "../actions";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

export function AccountContent({ account }: { account: AccountInfo | null }) {
  const t = useTranslations("settings.account");
  const router = useRouter();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    account?.avatarUrl ?? null
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<File | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarFileRef.current = file;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fullName", fullName);
    if (avatarFileRef.current) {
      formData.set("avatar", avatarFileRef.current);
    }

    startProfileTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        toast({
          type: "error",
          message:
            result.error === "avatarUploadFailed"
              ? t("avatarError")
              : t("profileError"),
        });
      } else {
        toast({ type: "success", message: t("profileSaved") });
        avatarFileRef.current = null;
        router.refresh();
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("newPassword", newPassword);

    startPasswordTransition(async () => {
      const result = await changePassword(formData);
      if (result?.error) {
        toast({ type: "error", message: t("passwordError") });
      } else {
        toast({ type: "success", message: t("passwordChanged") });
        setNewPassword("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="rounded-lg bg-card shadow-card-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-h4 text-foreground">{t("profileTitle")}</h2>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="flex flex-col gap-6 px-6 py-5 sm:flex-row sm:gap-6">
            {/* Avatar — left column, stretches to fields height */}
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted transition-colors sm:h-full sm:w-28 sm:rounded-md hover:bg-muted/80"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Icon name="Camera" className="size-6 text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="Camera" className="size-5 text-white" />
                </div>
              </button>
              <p className="text-p4 text-muted-foreground sm:hidden">
                {t("avatarHint")}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Fields — right column */}
            <div className="min-w-0 flex-1 space-y-5">
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="fullName">{t("nameLabel")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label size="lg">{t("emailLabel")}</Label>
                <Input
                  value={account?.email ?? ""}
                  disabled
                  className="opacity-50"
                />
                <p className="text-p4 text-muted-foreground">
                  {t("emailDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-border px-6 py-4">
            <Button type="submit" size="sm" disabled={profilePending}>
              {profilePending ? t("savingProfile") : t("saveProfile")}
            </Button>
          </div>
        </form>
      </div>

      {/* Language */}
      <LanguageCard />

      {/* Password */}
      <div className="rounded-lg bg-card shadow-card-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-h4 text-foreground">{t("passwordTitle")}</h2>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("newPasswordPlaceholder")}
                minLength={8}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={passwordPending}>
                {passwordPending ? t("changingPassword") : t("changePassword")}
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

function LanguageCard() {
  const tl = useTranslations("settings.language");
  return (
    <div className="rounded-lg bg-card shadow-card-lg">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-h4 text-foreground">{tl("title")}</h2>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-p3 text-muted-foreground">
          {tl("description")}
        </p>
        <LanguagePicker variant="full" align="end" />
      </div>
    </div>
  );
}
