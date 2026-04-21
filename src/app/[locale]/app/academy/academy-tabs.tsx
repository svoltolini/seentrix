"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { HugeIcon } from "@/components/huge-icon";
import { GlossaryIndex } from "@/app/[locale]/app/help/glossary/glossary-index";
import { SCREEN_LESSONS, type ScreenKey } from "@/lib/academy/screens";

export type TabKey = "lessons" | "by-screen" | "glossary" | "team-progress";

/**
 * Client-side tabbed shell for the Academy page.
 *
 * Four tabs:
 *   - Lessons — catalogue of all lessons
 *   - By Screen — reverse index, lessons grouped by Seentrix screen
 *   - Glossary — A-Z term index
 *   - Team Progress — admin/compliance-officer only; team completion grid
 */
export function AcademyTabs({
  initialTab = "lessons",
  completedLessonIds = [],
  isAdminOrCO = false,
  teamProgress,
}: {
  initialTab?: TabKey;
  completedLessonIds?: string[];
  isAdminOrCO?: boolean;
  teamProgress?: React.ReactNode;
}) {
  const t = useTranslations("academy");
  const [tab, setTab] = useState<string>(initialTab);
  const completed = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="line">
        <TabsTrigger value="lessons">{t("tabs.lessons")}</TabsTrigger>
        <TabsTrigger value="by-screen">{t("tabs.byScreen")}</TabsTrigger>
        <TabsTrigger value="glossary">{t("tabs.glossary")}</TabsTrigger>
        {isAdminOrCO && (
          <TabsTrigger value="team-progress">
            {t("tabs.teamProgress")}
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="lessons" className="mt-6">
        <LessonsGrid completed={completed} />
      </TabsContent>
      <TabsContent value="by-screen" className="mt-6">
        <ByScreenGrid completed={completed} />
      </TabsContent>
      <TabsContent value="glossary" className="mt-6">
        <GlossaryIndex />
      </TabsContent>
      {isAdminOrCO && (
        <TabsContent value="team-progress" className="mt-6">
          {teamProgress ?? (
            <p className="rounded-xl bg-white/[0.03] p-6 text-sm text-muted-foreground">
              —
            </p>
          )}
        </TabsContent>
      )}
    </Tabs>
  );
}

function LessonsGrid({ completed }: { completed: Set<string> }) {
  const t = useTranslations("academy.lessonCard");
  const lessons = Object.entries(ACADEMY_LESSONS);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {lessons.map(([id, lesson]) => (
        <LessonCard
          key={id}
          id={id}
          title={lesson.title}
          duration={lesson.duration}
          done={completed.has(id)}
          completedLabel={t("completed")}
          openLabel={t("open")}
        />
      ))}
    </div>
  );
}

function LessonCard({
  id,
  title,
  duration,
  done,
  completedLabel,
  openLabel,
}: {
  id: string;
  title: string;
  duration: string;
  done: boolean;
  completedLabel: string;
  openLabel: string;
}) {
  return (
    <Link
      href={`/app/academy/${id}`}
      className="group flex items-start gap-4 rounded-2xl bg-white/[0.03] p-6 transition-colors duration-300 hover:bg-white/[0.05]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-semibold text-foreground group-hover:text-primary">
          {title}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{duration}</span>
          <span className="text-muted-foreground/40">·</span>
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/10 px-2 py-0.5 font-medium text-[#16A34A]">
              {completedLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {openLabel}
            </span>
          )}
        </div>
      </div>
      <HugeIcon
        name="arrow-right-01-stroke-rounded"
        size={16}
        className="shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary"
      />
    </Link>
  );
}

function ByScreenGrid({ completed }: { completed: Set<string> }) {
  const t = useTranslations("academy.byScreen");
  const screens = Object.values(SCREEN_LESSONS);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {screens.map((screen) => (
        <ScreenCard
          key={screen.key}
          screen={screen}
          screenName={t(`screens.${screen.key as ScreenKey}`)}
          completed={completed}
          openLabel={t("openScreen")}
        />
      ))}
    </div>
  );
}

function ScreenCard({
  screen,
  screenName,
  completed,
  openLabel,
}: {
  screen: (typeof SCREEN_LESSONS)[ScreenKey];
  screenName: string;
  completed: Set<string>;
  openLabel: string;
}) {
  const tCard = useTranslations("academy.byScreenCard");
  const totalMinutes = screen.lessons.reduce((sum, id) => {
    const lesson = ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS];
    const match = lesson?.duration.match(/\d+/);
    return sum + (match ? parseInt(match[0], 10) : 0);
  }, 0);
  const doneCount = screen.lessons.filter((id) => completed.has(id)).length;

  return (
    <div className="rounded-2xl bg-white/[0.03] p-6 transition-colors duration-300 hover:bg-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[15px] font-semibold text-foreground">
            {screenName}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {tCard("meta", {
              count: screen.lessons.length,
              minutes: totalMinutes,
              done: doneCount,
              total: screen.lessons.length,
            })}
          </p>
        </div>
        <Link
          href={screen.href}
          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
        >
          {openLabel} →
        </Link>
      </div>
      <ul className="mt-4 space-y-1 border-t border-white/[0.04] pt-3">
        {screen.lessons.map((id) => {
          const lesson = ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS];
          if (!lesson) return null;
          const done = completed.has(id);
          return (
            <li key={id}>
              <Link
                href={`/app/academy/${id}`}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-white/[0.04]"
              >
                <HugeIcon
                  name={
                    done
                      ? "checkmark-circle-01-stroke-rounded"
                      : "circle-stroke-rounded"
                  }
                  size={14}
                  className={done ? "text-[#16A34A]" : "text-muted-foreground/40"}
                />
                <span className="flex-1 truncate text-foreground group-hover:text-primary">
                  {lesson.title}
                </span>
                <span className="shrink-0 text-muted-foreground/60">
                  {lesson.duration}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
