import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/app/settings/organization`);
}

export const metadata = { title: "Settings" };
