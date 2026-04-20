import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // If user doesn't need to change password, redirect to dashboard
  if (!user.app_metadata?.must_change_password) {
    redirect(`/${locale}/app/dashboard`);
  }

  return <ChangePasswordForm locale={locale} />;
}

export const metadata = { title: "Change password" };
