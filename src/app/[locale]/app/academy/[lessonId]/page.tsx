import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLesson, getLessonContent } from "@/lib/academy/lessons";
import type { LocaleId } from "@/lib/academy/types";
import { CurrentLessonProvider } from "@/lib/academy/current-lesson-context";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icon";
import { Quiz } from "./quiz";

/**
 * Lesson page. Renders the title, sections, and quiz. If the caller has
 * already passed this lesson, a banner above the quiz shows the completion
 * date + certificate hash; the quiz form is still shown so they can retake.
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
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon
          name="arrow-right-01-stroke-rounded"
          size={14}
          className="rotate-180"
        />
        {t("backToAcademy")}
      </Link>

      {/* Hero — borderless bg-muted to match the Academy card
          language (see academy-tabs.tsx → LessonCard). */}
      <div className="mb-8 rounded-md bg-muted p-6 md:p-8">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{lesson.duration}</span>
          <span className="text-muted-foreground">·</span>
          <span>
            {t("questionCount", { count: content.quiz.length })}
          </span>
        </div>
        <h1 className="mt-2 text-h2 leading-tight md:text-3xl">
          {content.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {content.summary}
        </p>
        <p className="mt-5 rounded-md bg-[#D97706]/10 px-3 py-2 text-[11px] leading-relaxed text-[#D97706]">
          {t("disclaimer")}
        </p>
      </div>

      {/* Sections */}
      <article className="space-y-8">
        {content.sections.map((section, i) => (
          <section key={i}>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground md:text-xl">
              {section.heading}
            </h2>
            <div className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:my-0.5">
              {section.body}
            </div>
          </section>
        ))}
      </article>

      {/* Quiz */}
      <div className="mt-12 border-t border-border pt-10">
        <h2 className="text-h3 md:text-2xl">
          {t("quizHeading")}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
          {t("quizIntro")}
        </p>

        {existingCompletion && (
          <div className="mt-5 flex flex-wrap items-start gap-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/[0.06] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/20 text-[#16A34A]">
              <Icon
                name="checkmark-circle-01-stroke-rounded"
                size={16}
              />
            </div>
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="font-semibold text-foreground">
                {t("alreadyPassed", {
                  score: Math.round(existingCompletion.score * 100),
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("certificateLabel")}:{" "}
                <span className="font-mono text-foreground/80">
                  {existingCompletion.certificate_hash.slice(0, 16)}…
                </span>
              </p>
            </div>
            <a
              href={`/api/academy/certificates/${lesson.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#16A34A]/40 bg-[#16A34A]/10 px-3 py-2 text-xs font-semibold text-[#16A34A] transition-colors hover:bg-[#16A34A]/20"
            >
              <Icon name="pdf-01-stroke-rounded" size={14} />
              {t("downloadCertificate")}
            </a>
          </div>
        )}

        <div className="mt-6">
          <Quiz lessonId={lesson.id} questions={content.quiz} />
        </div>
      </div>
    </div>
    </CurrentLessonProvider>
  );
}
