"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { LESSON_AUDIO } from "@/lib/academy/audio";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { GlossaryIndex } from "@/app/[locale]/app/help/glossary/glossary-index";
import { SCREEN_LESSONS, type ScreenKey } from "@/lib/academy/screens";
import { CertificateVerify } from "./certificate-verify";

export type TabKey =
  | "lessons"
  | "by-screen"
  | "glossary"
  | "team-progress"
  | "verify";

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
        {isAdminOrCO && (
          <TabsTrigger value="verify">
            {t.has("tabs.verify") ? t("tabs.verify") : "Verify certificate"}
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
            <p className="rounded-md bg-muted p-6 text-p3 text-muted-foreground">
              —
            </p>
          )}
        </TabsContent>
      )}
      {isAdminOrCO && (
        <TabsContent value="verify" className="mt-6">
          <CertificateVerify />
        </TabsContent>
      )}
    </Tabs>
  );
}

function LessonsGrid({ completed }: { completed: Set<string> }) {
  const t = useTranslations("academy.lessonCard");
  const lessons = Object.entries(ACADEMY_LESSONS);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {lessons.map(([id, lesson], i) => (
        <LessonCard
          key={id}
          id={id}
          index={i + 1}
          title={lesson.title}
          duration={lesson.duration}
          done={completed.has(id)}
          hasAudio={id in LESSON_AUDIO}
          completedLabel={t("completed")}
          openLabel={t("open")}
          audioLabel={t("audio")}
        />
      ))}
    </div>
  );
}

// Clay course-cover gradients (design `.sx-course [data-tone]` a–d), cycled
// by lesson index so the grid reads varied without per-lesson config.
const COURSE_TONES = [
  "linear-gradient(135deg,#1f8a5b,#2fa56f)",
  "linear-gradient(135deg,#2b2a26,#4a463d)",
  "linear-gradient(135deg,#c0892e,#d9a64a)",
  "linear-gradient(135deg,#3d6470,#56838f)",
] as const;

function LessonCard({
  id,
  index,
  title,
  duration,
  done,
  hasAudio,
  completedLabel,
  openLabel,
  audioLabel,
}: {
  id: string;
  index: number;
  title: string;
  duration: string;
  done: boolean;
  hasAudio: boolean;
  completedLabel: string;
  openLabel: string;
  audioLabel: string;
}) {
  return (
    <Link
      href={`/app/academy/${id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(60,40,20,0.07)]"
    >
      {/* Gradient cover with lesson number / done badge */}
      <div
        className="relative h-[88px] shrink-0"
        style={{ background: COURSE_TONES[(index - 1) % COURSE_TONES.length] }}
      >
        <span
          className={cn(
            "absolute left-4 top-4 flex size-9 items-center justify-center rounded-md text-l5",
            done ? "bg-white text-primary" : "bg-white/20 text-white backdrop-blur-sm",
          )}
        >
          {done ? (
            <Icon
              name="checkmark-circle-01-stroke-rounded"
              size={20}
              variant="Bold"
            />
          ) : (
            <span className="tabular-nums">{index}</span>
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1 p-5">
        <p className="font-heading text-[17px] font-semibold tracking-[-0.2px] text-foreground group-hover:text-primary">
          {title}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-p4">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="time-quarter-02-stroke-rounded" size={13} />
            {duration}
          </span>
          {hasAudio && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2 py-0.5 text-l6-plus text-accent">
              <Icon name="VolumeHigh" size={11} />
              {audioLabel}
            </span>
          )}
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-l6-plus text-success">
              {completedLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus text-primary">
              {openLabel}
            </span>
          )}
        </div>
      </div>
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
    <div className="rounded-lg border border-border bg-card p-[17px] transition-colors duration-300 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-h5 text-foreground">
            {screenName}
          </p>
          <p className="mt-0.5 text-p4 text-muted-foreground">
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
          className="shrink-0 rounded-sm px-2.5 py-1 text-l6-plus text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {openLabel} →
        </Link>
      </div>
      <ul className="mt-4 space-y-1 border-t border-border pt-3">
        {screen.lessons.map((id) => {
          const lesson = ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS];
          if (!lesson) return null;
          const done = completed.has(id);
          return (
            <li key={id}>
              <Link
                href={`/app/academy/${id}`}
                className="group flex items-center gap-2 rounded-sm px-2 py-1.5 text-p4 transition-colors hover:bg-muted/60"
              >
                <Icon
                  name={
                    done
                      ? "checkmark-circle-01-stroke-rounded"
                      : "circle-stroke-rounded"
                  }
                  size={14}
                  className={done ? "text-success" : "text-muted-foreground"}
                />
                <span className="flex-1 truncate text-foreground group-hover:text-primary">
                  {lesson.title}
                </span>
                <span className="shrink-0 text-muted-foreground">
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
