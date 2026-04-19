"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { HugeIcon } from "@/components/huge-icon";
import { GlossaryIndex } from "@/app/[locale]/app/help/glossary/glossary-index";

/**
 * Client-side tabbed shell for the Academy page.
 *
 * Tabs default to "lessons" but can be deep-linked via the `initialTab`
 * prop — the legacy /app/help/glossary route redirects to
 * /app/academy?tab=glossary, which the server page reads from searchParams
 * and forwards here.
 */
export function AcademyTabs({
  initialTab = "lessons",
}: {
  initialTab?: "lessons" | "glossary";
}) {
  const t = useTranslations("academy");
  const [tab, setTab] = useState<string>(initialTab);

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="line">
        <TabsTrigger value="lessons">{t("tabs.lessons")}</TabsTrigger>
        <TabsTrigger value="glossary">{t("tabs.glossary")}</TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="mt-6">
        <LessonsGrid />
      </TabsContent>
      <TabsContent value="glossary" className="mt-6">
        <GlossaryIndex />
      </TabsContent>
    </Tabs>
  );
}

function LessonsGrid() {
  const t = useTranslations("help");
  const lessons = Object.entries(ACADEMY_LESSONS);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {lessons.map(([id, lesson]) => (
        <Link
          key={id}
          href={`/app/academy/${id}`}
          className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.12]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeIcon name="elearning-exchange-stroke-rounded" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary">
              {lesson.title}
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">{lesson.duration}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D97706]/10 px-2 py-0.5 font-medium text-[#D97706]">
                {t("comingSoon")}
              </span>
            </div>
          </div>
          <HugeIcon
            name="arrow-right-01-stroke-rounded"
            size={16}
            className="shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary"
          />
        </Link>
      ))}
    </div>
  );
}
