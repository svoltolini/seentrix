import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLesson, getLessonContent } from "@/lib/academy/lessons";
import type { LocaleId } from "@/lib/academy/types";
import { getLessonAudio } from "@/lib/academy/audio";
import { CurrentLessonProvider } from "@/lib/academy/current-lesson-context";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icon";
import { Quiz } from "./quiz";
import { LessonAudioPlayer } from "./lesson-audio";

/**
 * Lesson reader. Renders the lesson hero, an optional AI-generated audio
 * briefing, the numbered content sections, and the quiz. If the learner has
 * already passed, a completion banner with the certificate hash sits above the
 * quiz (which stays available for retakes).
 *
 * Styling uses design-system tokens throughout (no `prose-invert`, no
 * hardcoded hexes) so the reader matches the rest of the light-theme app.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string; locale: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  const locale = (await getLocale()) as LocaleId;
  const content = getLessonContent(lesson, locale);
  const t = await getTranslations("academy.lesson");
  const audio = getLessonAudio(lesson.id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type CompletionRow = {
    completed_at: string;
    score: number;
    certificate_hash: string;
  };
  let existingCompletion: CompletionRow | null = null;

  if (user) {
    const { data } = await supabase
      .from("academy_completions")
      .select("completed_at, score, certificate_hash")
      .eq("user_id", user.id)
      .eq("lesson_id", lesson.id)
      .maybeSingle();
    existingCompletion = (data ?? null) as CompletionRow | null;
  }

  return (
    <CurrentLessonProvider lessonId={lesson.id}>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <Link
          href="/app/academy"
          className="mb-6 inline-flex items-center gap-1.5 text-p4 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon
            name="arrow-right-01-stroke-rounded"
            size={14}
            className="rotate-180"
          />
          {t("backToAcademy")}
        </Link>

        {/* Hero */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-p4 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="time-quarter-02-stroke-rounded" size={14} />
              {lesson.duration}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="task-done-02-stroke-rounded" size={14} />
              {t("questionCount", { count: content.quiz.length })}
            </span>
            {existingCompletion && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-l6-plus text-success">
                <Icon name="checkmark-circle-01-stroke-rounded" size={12} />
                {t("completedBadge")}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-h1 leading-tight text-foreground">
            {content.title}
          </h1>
          <p className="mt-2 text-p2 text-muted-foreground">
            {content.summary}
          </p>
        </header>

        {/* AI audio briefing (only on lessons that ship one) */}
        {audio && (
          <div className="mb-8">
            <LessonAudioPlayer audio={audio} title={content.title} />
          </div>
        )}

        {/* Sections — numbered for a clear reading rhythm. */}
        <article className="space-y-10">
          {content.sections.map((section, i) => (
            <section key={i} className="scroll-mt-24">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-l6-plus text-primary">
                  {i + 1}
                </span>
                <h2 className="text-h4 text-foreground">{section.heading}</h2>
              </div>
              <div className="prose prose-sm max-w-none pl-10 text-p3 leading-relaxed text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:my-0.5">
                {section.body}
              </div>
            </section>
          ))}
        </article>

        {/* Quiz */}
        <div className="mt-12 border-t border-border pt-10">
          <h2 className="text-h3 text-foreground">{t("quizHeading")}</h2>
          <p className="mt-1.5 text-p3 text-muted-foreground">
            {t("quizIntro")}
          </p>

          {existingCompletion && (
            <div className="mt-5 flex flex-wrap items-start gap-3 rounded-md border border-success/25 bg-success/[0.06] p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Icon name="checkmark-circle-01-stroke-rounded" size={18} />
              </div>
              <div className="min-w-0 flex-1 text-p3">
                <p className="font-semibold text-foreground">
                  {t("alreadyPassed", {
                    score: Math.round(existingCompletion.score * 100),
                  })}
                </p>
                <p className="mt-0.5 text-p4 text-muted-foreground">
                  {t("certificateLabel")}:{" "}
                  <span className="font-mono text-foreground/80">
                    {existingCompletion.certificate_hash.slice(0, 16)}…
                  </span>
                </p>
              </div>
              <a
                href={`/api/academy/certificates/${lesson.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-success/30 bg-success/10 px-3 py-2 text-p4 font-semibold text-success transition-colors hover:bg-success/20"
              >
                <Icon name="pdf-01-stroke-rounded" size={14} />
                {t("downloadCertificate")}
              </a>
            </div>
          )}

          <div className="mt-6">
            <Quiz
              lessonId={lesson.id}
              questions={content.quiz}
              alreadyPassed={Boolean(existingCompletion)}
              passedScore={existingCompletion?.score}
            />
          </div>
        </div>
      </div>
    </CurrentLessonProvider>
  );
}
