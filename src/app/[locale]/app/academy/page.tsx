import { getTranslations } from "next-intl/server";
import { AcademyTabs } from "./academy-tabs";

/**
 * Academy hub — Layer 2 landing.
 *
 * Two tabs: Lessons (the catalogue of CRA / security / SBOM lessons) and
 * Glossary (the A-Z reference). Tabs can be deep-linked via
 * /app/academy?tab=glossary — the legacy /app/help/glossary route
 * redirects here with that query so old bookmarks still resolve.
 */
export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: "lessons" | "glossary" =
    tab === "glossary" ? "glossary" : "lessons";

  const t = await getTranslations("help");
  const tAcademy = await getTranslations("academy");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div
        className="mb-8 overflow-hidden rounded-2xl bg-cover bg-center p-6 md:mb-10 md:p-10"
        style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-[#F59E0B]" />
          {t("comingSoon")}
        </div>
        <h1 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
          {tAcademy("hero.title")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
          {tAcademy("hero.description")}
        </p>
      </div>

      <AcademyTabs initialTab={initialTab} />
    </div>
  );
}
