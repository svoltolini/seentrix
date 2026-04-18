import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ACADEMY_LESSONS, type AcademyLessonId } from "@/lib/glossary";
import { HugeIcon } from "@/components/huge-icon";

/**
 * Academy lesson placeholder.
 *
 * Real lesson content lands in Layer 2 — today every route renders the
 * Coming soon state so the Term side-sheet "Open lesson →" link doesn't
 * 404. When a lesson is authored, replace this file with a lesson-specific
 * MDX/JSX page under src/content or similar.
 */
export default async function AcademyLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = ACADEMY_LESSONS[lessonId as AcademyLessonId];
  if (!lesson) notFound();

  const t = await getTranslations("help");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Link
        href="/app/academy"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeIcon name="arrow-right-01-stroke-rounded" size={14} className="rotate-180" />
        Academy
      </Link>

      <div
        className="overflow-hidden rounded-2xl bg-cover bg-center p-8 md:p-12"
        style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-[#F59E0B]" />
          {t("comingSoon")}
        </div>
        <h1 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm text-white/70">{lesson.duration}</p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80">
          This lesson is being written. It will cover the topic in depth with
          examples, a short quiz, and a certificate you can attach to your
          audit trail. Meanwhile, the glossary entries that feed into this
          lesson are available right now from any <span className="font-semibold text-white">?</span>{" "}
          icon across Seentrix.
        </p>
      </div>
    </div>
  );
}
