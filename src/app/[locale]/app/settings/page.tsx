import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/app/settings/organization");
}

export const metadata = { title: "Settings" };
