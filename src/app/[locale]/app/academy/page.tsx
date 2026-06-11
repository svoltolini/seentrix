import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AcademyTabs, type TabKey } from "./academy-tabs";
import { TeamProgress } from "./team-progress";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { requiredLessonsForRole, allLessonIds } from "@/lib/academy/lessons";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { ReferenceCard, ReferenceBadge } from "@/components/reference-card";

/**
 * Academy hub — Layer 2 landing.
 *
 * Tabs: Lessons / By Screen / Glossary / Team Progress (admin + CO only).
 * Tabs deep-link via /app/academy?tab=glossary so /app/help/glossary still
 * works. `completedLessonIds` powers the ✓ ticks on the Lessons + By
 * Screen cards without a client fetch.
 */
export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const locale = (await getLocale()) as LocaleId;
  const t = await getTranslations("academy");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedLessonIds: string[] = [];
  let role: string | null = null;
  if (user) {
    const [completionsRes, userRow] = await Promise.all([
      supabase
        .from("academy_completions")
        .select("lesson_id")
        .eq("user_id", user.id),
      supabase.from("users").select("role").eq("id", user.id).single(),
    ]);
    completedLessonIds = (completionsRes.data ?? []).map(
      (r) => (r as { lesson_id: string }).lesson_id,
    );
    role = (userRow.data as { role: string } | null)?.role ?? null;
  }

  const isAdminOrCO = role === "admin" || role === "compliance_officer";

  // Overall catalogue progress for the hero progress ring.
  const totalLessons = allLessonIds().length;
  const completedTotal = completedLessonIds.filter((id) =>
    allLessonIds().includes(id),
  ).length;
  const overallPct =
    totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0;

  // Resume banner target — the first uncompleted lesson in catalogue order.
  // Hidden when nothing is started yet or everything is done.
  const ids = allLessonIds();
  const nextIdx = ids.findIndex((id) => !completedLessonIds.includes(id));
  const resumeLesson =
    completedTotal > 0 && nextIdx !== -1
      ? {
          id: ids[nextIdx],
          index: nextIdx,
          title:
            ACADEMY_LESSONS[ids[nextIdx] as keyof typeof ACADEMY_LESSONS]
              ?.title ?? ids[nextIdx],
          duration:
            ACADEMY_LESSONS[ids[nextIdx] as keyof typeof ACADEMY_LESSONS]
              ?.duration ?? "",
        }
      : null;

  // When the training gate is active, render the blocking banner at the top
  // of the Academy so users understand why the rest of the app isn't
  // reachable — without that explanation the redirect feels like a bug.
  const mustCompleteTraining =
    user?.app_metadata?.must_complete_training === true;
  const requiredIds = role
    ? requiredLessonsForRole(role as RoleId)
    : [];
  const requiredDone = requiredIds.filter((id) =>
    completedLessonIds.includes(id),
  ).length;
  const tGate = await getTranslations("academy.gate");

  const initialTab: TabKey =
    tab === "glossary"
      ? "glossary"
      : tab === "by-screen"
        ? "by-screen"
        : tab === "team-progress" && isAdminOrCO
          ? "team-progress"
          : "lessons";

  return (
    <div className="pb-12">
      {mustCompleteTraining ? (
        <ReferenceCard className="mb-8 p-6 md:mb-10 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <ReferenceBadge className="mb-3">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                {t("hero.title")}
              </ReferenceBadge>
              <h1 className="text-h2 leading-tight text-primary-foreground md:text-h1">
                {tGate("title")}
              </h1>
              <p className="mt-2 max-w-xl text-p3 text-primary-foreground/80 md:text-p2">
                {tGate("subtitle")}
              </p>
              <p className="mt-3 text-p3 text-primary-foreground">
                {tGate("progress", {
                  done: requiredDone,
                  total: requiredIds.length,
                })}
              </p>
            </div>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10 backdrop-blur-sm">
              <Icon
                name="lock-password-stroke-rounded"
                size={24}
                className="text-primary-foreground"
              />
            </div>
          </div>
        </ReferenceCard>
      ) : (
        <>
          {/* Screen header — Clay eyebrow + serif title + sub */}
          <div className="mb-[18px]">
            <p className="text-[12px] font-semibold uppercase tracking-[1px] text-primary">
              {t.has("list.eyebrow") ? t("list.eyebrow") : "Learn"}
            </p>
            <h1 className="mt-2.5 text-h1 text-foreground">{t("hero.title")}</h1>
            <p className="mt-2.5 max-w-[60ch] text-[14.5px] leading-relaxed text-muted-foreground">
              {t("hero.description")}
            </p>
          </div>

          {/* Stat row — three flat cards with serif values */}
          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <AcademyStat
              label={
                t.has("list.statCompleted")
                  ? t("list.statCompleted")
                  : "Lessons completed"
              }
              value={completedTotal}
              suffix={` / ${totalLessons}`}
            />
            <AcademyStat
              label={
                t.has("list.statRequired")
                  ? t("list.statRequired")
                  : "Required for your role"
              }
              value={requiredDone}
              suffix={` / ${requiredIds.length}`}
            />
            <AcademyStat
              label={
                t.has("list.statProgress")
                  ? t("list.statProgress")
                  : "Catalogue progress"
              }
              value={overallPct}
              suffix="%"
            />
          </div>

          {/* Resume banner — dark ink, ring + next lesson + green Resume */}
          {resumeLesson && (
            <div className="mb-[18px] flex flex-col gap-5 rounded-lg bg-dark-cta p-[22px] text-white sm:flex-row sm:items-center sm:px-[26px]">
              <ResumeRing pct={overallPct} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[1px] text-[color:var(--primary-2)]">
                  {t.has("list.resumeEyebrow")
                    ? t("list.resumeEyebrow")
                    : "Continue learning"}
                </p>
                <p className="mt-1.5 truncate font-heading text-[21px] font-semibold tracking-[-0.3px]">
                  {resumeLesson.title}
                </p>
                <p className="mt-1 text-[13px] text-white/60">
                  {resumeLesson.duration} ·{" "}
                  {t.has("list.lessonOf")
                    ? t("list.lessonOf", {
                        n: resumeLesson.index + 1,
                        total: totalLessons,
                      })
                    : `Lesson ${resumeLesson.index + 1} of ${totalLessons}`}
                </p>
              </div>
              <Link
                href={`/app/academy/${resumeLesson.id}`}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-[18px] text-[13.5px] font-semibold text-primary-foreground transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--primary)_86%,#000)]"
              >
                {t.has("list.resumeCta") ? t("list.resumeCta") : "Resume"}
                <Icon name="ArrowRight" size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </>
      )}

      <AcademyTabs
        initialTab={initialTab}
        completedLessonIds={completedLessonIds}
        isAdminOrCO={isAdminOrCO}
        teamProgress={isAdminOrCO ? <TeamProgress locale={locale} /> : null}
      />
    </div>
  );
}

/** Flat stat card — muted label over a serif value with a muted suffix. */
function AcademyStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-[17px]">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2.5 font-heading text-[34px] font-semibold leading-none tracking-[-0.8px] text-foreground">
        {value}
        {suffix && (
          <span className="text-[18px] text-muted-foreground">{suffix}</span>
        )}
      </p>
    </div>
  );
}

/** 72px green ring on the dark resume banner with the % centered in white. */
function ResumeRing({ pct }: { pct: number }) {
  const size = 72;
  const thickness = 8;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={thickness} />
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
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[18px] font-semibold text-white">
        {pct}
        <span className="text-[11px] text-white/60">%</span>
      </span>
    </div>
  );
}

export const metadata = { title: "Academy" };
