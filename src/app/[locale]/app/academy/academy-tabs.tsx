"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { LESSON_AUDIO } from "@/lib/academy/audio";
import { Icon } from "@/components/icon";
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
  initialScreen,
  completedLessonIds = [],
  isAdminOrCO = false,
  teamProgress,
}: {
  initialTab?: TabKey;
  initialScreen?: ScreenKey;
  completedLessonIds?: string[];
  isAdminOrCO?: boolean;
  teamProgress?: React.ReactNode;
}) {
  const t = useTranslations("academy");
  const [tab, setTab] = useState<string>(initialTab);
  const completed = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  // Follow ?tab= deep-links even when the page re-renders in place (the
  // component instance survives a same-route navigation, so the initial
  // useState alone would keep showing the previously selected tab).
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

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
        <ByScreenGrid completed={completed} initialScreen={initialScreen} />
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
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
      {lessons.map(([id, lesson], i) => (
        <LessonCard
          key={id}
          id={id}
          index={i + 1}
          total={lessons.length}
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

/** Level badge derived from catalogue position (thirds). */
function levelOf(index: number, total: number): string {
  const third = total / 3;
  if (index <= third) return "Foundations";
  if (index <= third * 2) return "Intermediate";
  return "Advanced";
}

function LessonCard({
  id,
  index,
  total,
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
  total: number;
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
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(60,40,20,0.07)]"
    >
      {/* Gradient cover (compact 112px) with the level badge bottom-left */}
      <div
        className="relative flex h-[112px] shrink-0 items-end p-4"
        style={{ background: COURSE_TONES[(index - 1) % COURSE_TONES.length] }}
      >
        <span className="rounded-full bg-black/[0.18] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.5px] text-white/90">
          {levelOf(index, total)}
        </span>
        {done && (
          <span className="absolute right-3.5 top-3.5 flex size-7 items-center justify-center rounded-full bg-white text-primary">
            <Icon name="check" size={14} variant="Bold" />
          </span>
        )}
      </div>

      {/* Body — serif title, meta, then state footer */}
      <div className="flex min-w-0 flex-1 flex-col px-5 pb-5 pt-[15px]">
        <p className="font-heading text-[17px] font-semibold leading-[1.25] tracking-[-0.2px] text-foreground">
          {title}
        </p>
        <div className="flex-1" />

        {done ? (
          /* Completed state — label row over a full green bar */
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">{completedLabel}</span>
              <span className="font-bold tabular-nums text-foreground">
                100%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[color:var(--primary-3)]">
              <div className="h-full w-full rounded-full bg-primary" />
            </div>
          </div>
        ) : (
          /* Not-started state — meta items + ghost Start pushed right */
          <div className="mt-4 flex items-center gap-3.5">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Icon name="time-quarter-02-stroke-rounded" size={13} />
              {duration}
            </span>
            {hasAudio && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Icon name="VolumeHigh" size={13} />
                {audioLabel}
              </span>
            )}
            <span className="ml-auto inline-flex h-8 items-center rounded-[10px] border border-border-strong bg-card px-[13px] text-[12.5px] font-semibold text-foreground transition-colors duration-150 group-hover:bg-muted">
              {openLabel}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ByScreenGrid({
  completed,
  initialScreen,
}: {
  completed: Set<string>;
  initialScreen?: ScreenKey;
}) {
  const t = useTranslations("academy.byScreen");
  const screens = Object.values(SCREEN_LESSONS);

  // Deep-links from the floating "Learn this screen" pill land here with
  // ?screen=<key> — scroll that screen's card into view. Deferred a tick
  // because the router scrolls to the top right after a navigation commits;
  // an immediate scrollIntoView gets overridden and the page appears to
  // land on the Academy header instead of the targeted card.
  useEffect(() => {
    if (!initialScreen) return;
    const timer = setTimeout(() => {
      document
        .getElementById(`academy-screen-${initialScreen}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [initialScreen]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {screens.map((screen) => (
        <ScreenCard
          key={screen.key}
          screen={screen}
          screenName={t(`screens.${screen.key as ScreenKey}`)}
          completed={completed}
          highlighted={screen.key === initialScreen}
        />
      ))}
    </div>
  );
}

function ScreenCard({
  screen,
  screenName,
  completed,
  highlighted = false,
}: {
  screen: (typeof SCREEN_LESSONS)[ScreenKey];
  screenName: string;
  completed: Set<string>;
  highlighted?: boolean;
}) {
  const tCard = useTranslations("academy.byScreenCard");
  const totalMinutes = screen.lessons.reduce((sum, id) => {
    const lesson = ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS];
    const match = lesson?.duration.match(/\d+/);
    return sum + (match ? parseInt(match[0], 10) : 0);
  }, 0);
  const doneCount = screen.lessons.filter((id) => completed.has(id)).length;

  return (
    <div
      id={`academy-screen-${screen.key}`}
      className={cn(
        "rounded-lg border bg-card p-[17px] transition-colors duration-300 hover:bg-muted/30",
        highlighted ? "border-primary/50" : "border-border",
      )}
    >
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
        {/* No "Open screen" link here — it sat where users expected the
            course to open and bounced them back out of the Academy. The
            lessons below are the card's actions. */}
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
