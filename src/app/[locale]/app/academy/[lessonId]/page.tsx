import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLesson, getLessonContent } from "@/lib/academy/lessons";
import type { LocaleId } from "@/lib/academy/types";
import { getLessonAudio } from "@/lib/academy/audio";
import { allLessonIds } from "@/lib/academy/lessons";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { CurrentLessonProvider } from "@/lib/academy/current-lesson-context";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
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
  const audio = getLessonAudio(lesson.id, locale);

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

  // Tone gradient + level badge — same a/b/c/d mapping as the listing cards,
  // keyed by catalogue position so card cover and detail hero always match.
  const catalogue = allLessonIds();
  const lessonIdx = Math.max(0, catalogue.indexOf(lesson.id));
  const TONES = [
    "linear-gradient(135deg,#1f8a5b,#2fa56f)",
    "linear-gradient(135deg,#2b2a26,#4a463d)",
    "linear-gradient(135deg,#c0892e,#d9a64a)",
    "linear-gradient(135deg,#3d6470,#56838f)",
  ] as const;
  const tone = TONES[lessonIdx % TONES.length];
  const third = catalogue.length / 3;
  const level =
    lessonIdx + 1 <= third
      ? "Foundations"
      : lessonIdx + 1 <= third * 2
        ? "Intermediate"
        : "Advanced";

  return (
    <CurrentLessonProvider lessonId={lesson.id}>
      <div className="pb-12">
        <Link
          href="/app/academy"
          className="mb-[18px] inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon
            name="arrow-right-01-stroke-rounded"
            size={14}
            className="rotate-180"
          />
          {t("backToAcademy")}
        </Link>

        {/* Hero — tone gradient, serif title, meta row */}
        <header
          className="overflow-hidden rounded-2xl px-8 py-[30px] text-white"
          style={{ background: tone }}
        >
          <div className="max-w-[640px]">
            <span className="inline-block rounded-full bg-white/[0.18] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.5px] text-white/90">
              {level}
            </span>
            <h1 className="mt-3.5 font-heading text-[32px] font-semibold leading-tight tracking-[-0.6px] text-balance">
              {content.title}
            </h1>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-white/[0.82]">
              {content.summary}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-[22px] text-[13px] text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="time-quarter-02-stroke-rounded" size={14} />
                {lesson.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="task-done-02-stroke-rounded" size={14} />
                {t("questionCount", { count: content.quiz.length })}
              </span>
              {existingCompletion && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="checkmark-circle-01-stroke-rounded" size={14} />
                  {t("completedBadge")}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Two-column: content + 340px rail */}
        <div className="mt-3.5 grid items-start gap-3.5 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 rounded-lg border border-border bg-card p-[17px] sm:p-6">
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
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-l6-plus text-primary">
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
        <div id="quiz" className="mt-12 scroll-mt-24 border-t border-border pt-10">
          <h2 className="text-h3 text-foreground">{t("quizHeading")}</h2>
          <p className="mt-1.5 text-p3 text-muted-foreground">
            {t("quizIntro")}
          </p>

          {existingCompletion && (
            <div className="mt-5 flex w-full flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
              <IconBadge
                name="checkmark-circle-01-stroke-rounded"
                tone="success"
                size="lg"
              />
              <div className="min-w-0 flex-1 text-p3">
                <p className="text-h6 text-foreground">
                  {t("alreadyPassed", {
                    score: Math.round(existingCompletion.score * 100),
                  })}
                </p>
                <p className="mt-0.5 text-p4 text-muted-foreground">
                  {t("downloadCertificateHint")}
                </p>
              </div>
              <a
                href={`/api/academy/certificates/${lesson.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border-outline bg-card px-3 py-2 text-p4 text-foreground transition-colors hover:bg-muted"
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

          {/* RIGHT RAIL — progress + key-value, then the Copilot prompt */}
          <aside className="flex min-w-0 flex-col gap-3.5">
            <div className="rounded-lg border border-border bg-card p-[17px]">
              <div className="flex flex-col items-center gap-3 py-2">
                <LessonRing pct={existingCompletion ? 100 : 0} />
                <p className="text-[13px] text-muted-foreground">
                  {existingCompletion
                    ? t("completedBadge")
                    : (t.has("notStarted") ? t("notStarted") : "Not started")}
                </p>
              </div>
              <a
                href="#quiz"
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-[18px] text-[13.5px] font-semibold text-primary-foreground transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--primary)_86%,#000)]"
              >
                {existingCompletion
                  ? (t.has("reviewCta") ? t("reviewCta") : "Review lesson")
                  : (t.has("startCta") ? t("startCta") : "Start lesson")}
              </a>
              <dl className="mt-4 flex flex-col">
                <KvRow k={t.has("kvLevel") ? t("kvLevel") : "Level"} v={level} />
                <KvRow
                  k={t.has("kvDuration") ? t("kvDuration") : "Duration"}
                  v={lesson.duration}
                />
                <KvRow
                  k={t.has("kvQuestions") ? t("kvQuestions") : "Questions"}
                  v={String(content.quiz.length)}
                />
                <KvRow
                  k={t.has("kvCertificate") ? t("kvCertificate") : "Certificate"}
                  v={
                    t.has("kvCertificateValue")
                      ? t("kvCertificateValue")
                      : "On completion"
                  }
                  last
                />
              </dl>
            </div>

            {/* Copilot prompt — accent-soft card */}
            <div
              className="rounded-lg p-[17px]"
              style={{
                background: "var(--accent-soft)",
                border:
                  "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
              }}
            >
              <p className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                <Icon
                  name="ai-magic-stroke-rounded"
                  size={16}
                  className="text-primary"
                />
                Copilot
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {t.has("copilotPrompt")
                  ? t("copilotPrompt")
                  : "Questions about this topic? Ask the Copilot to explain it in the context of your products."}
              </p>
              <div className="mt-3">
                <AskSeentrixAI
                  seed={`Explain "${content.title}" and how it applies to my products in Seentrix.`}
                  label={t.has("copilotCta") ? t("copilotCta") : "Ask Copilot"}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CurrentLessonProvider>
  );
}

/** KV row — muted key left, 600 value right, hairline divider. */
function KvRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-3 py-3 text-[13.5px]" +
        (last ? "" : " border-b border-border")
      }
    >
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-semibold text-foreground">{v}</dd>
    </div>
  );
}

/** 150px progress ring for the rail (green fill, serif % value). */
function LessonRing({ pct }: { pct: number }) {
  const size = 150;
  const thickness = 13;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-3)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[40px] font-semibold text-foreground">
        {pct}
        <span className="text-[18px] text-muted-foreground">%</span>
      </span>
    </div>
  );
}
