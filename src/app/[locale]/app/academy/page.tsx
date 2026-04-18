import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { HugeIcon } from "@/components/huge-icon";

/**
 * Academy hub — Layer 2 landing.
 *
 * Renders the full lesson catalogue with each one marked "Coming soon" until
 * the content lands. The lesson ids + titles come from @/lib/glossary's
 * ACADEMY_LESSONS so the glossary side-sheets link to the same canonical
 * registry. When a lesson ships, swap its entry in ACADEMY_LESSONS with a
 * real page and drop the Coming soon flag.
 */
export default async function AcademyPage() {
  const t = await getTranslations("help");
  const lessons = Object.entries(ACADEMY_LESSONS);

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
          Seentrix Academy
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
          Short lessons on the CRA, vulnerability handling, SBOMs, and the
          obligations behind every field you fill in across Seentrix.
          Complete tracks to collect audit-ready certificates for each
          team member.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {lessons.map(([id, lesson]) => (
          <LessonCard
            key={id}
            id={id}
            title={lesson.title}
            duration={lesson.duration}
            comingSoonLabel={t("comingSoon")}
          />
        ))}
      </div>
    </div>
  );
}

function LessonCard({
  id,
  title,
  duration,
  comingSoonLabel,
}: {
  id: string;
  title: string;
  duration: string;
  comingSoonLabel: string;
}) {
  return (
    <Link
      href={`/app/academy/${id}`}
      className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.12]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <HugeIcon name="sparkles-stroke-rounded" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary">
          {title}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{duration}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D97706]/10 px-2 py-0.5 font-medium text-[#D97706]">
            {comingSoonLabel}
          </span>
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
