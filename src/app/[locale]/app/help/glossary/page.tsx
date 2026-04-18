import { getTranslations } from "next-intl/server";
import { GlossaryIndex } from "./glossary-index";

export default async function GlossaryPage() {
  const t = await getTranslations("glossary._meta");
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl font-bold md:text-3xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
          {t("pageSubtitle")}
        </p>
      </div>
      <GlossaryIndex />
    </div>
  );
}
