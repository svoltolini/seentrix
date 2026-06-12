import { getTranslations } from "next-intl/server";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="pb-12">
      {/* Section head — Clay eyebrow + serif title */}
      <div className="mb-7">
        <p className="text-[12px] font-semibold uppercase tracking-[1px] text-primary">
          {t.has("eyebrow") ? t("eyebrow") : "Workspace"}
        </p>
        <h1 className="mt-2.5 text-h1">{t("title")}</h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Two-column: 220px left vertical nav + the active panel */}
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
