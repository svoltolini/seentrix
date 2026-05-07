import { getTranslations } from "next-intl/server";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-[1120px] space-y-8 pb-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">
            {t("title")}
          </h1>
          <p className="mt-1.5 text-p3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
