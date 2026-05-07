import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.app_metadata?.must_change_password) {
    redirect("/app/dashboard");
  }

  return <ChangePasswordForm />;
}

export const metadata = { title: "Change password" };
