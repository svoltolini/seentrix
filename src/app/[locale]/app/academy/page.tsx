import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AcademyTabs, type TabKey } from "./academy-tabs";
import { TeamProgress } from "./team-progress";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { requiredLessonsForRole, allLessonIds } from "@/lib/academy/lessons";
import { Icon } from "@/components/icon";
import { ReferenceCard } from "@/components/reference-card";

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
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      {mustCompleteTraining ? (
        <ReferenceCard className="mb-8 p-6 md:mb-10 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                {t("hero.title")}
              </div>
              <h1 className="text-h2 leading-tight text-white md:text-3xl">
                {tGate("title")}
              </h1>
              <p className="mt-2 max-w-xl text-p3 text-white/80 md:text-p2">
                {tGate("subtitle")}
              </p>
              <p className="mt-3 text-p3 text-white">
                {tGate("progress", {
                  done: requiredDone,
                  total: requiredIds.length,
                })}
              </p>
            </div>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Icon
                name="lock-password-stroke-rounded"
                size={24}
                className="text-white"
              />
            </div>
          </div>
        </ReferenceCard>
      ) : (
        <ReferenceCard className="mb-8 p-6 md:mb-10 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
            <Icon name="elearning-exchange-stroke-rounded" size={12} />
            {t("hero.eyebrow")}
          </div>
          <h1 className="text-h2 leading-tight text-white md:text-3xl">
            {t("hero.title")}
          </h1>
          <p className="mt-2 text-p3 text-white/80 md:text-p2">
            {t("hero.description")}
          </p>
          {/* Compact horizontal progress — a slim full-width bar with a small
              caption, instead of a large ring, so the hero stays low-profile
              while still using the card's full width. */}
          <HeroProgress
            pct={overallPct}
            label={`${completedTotal}/${totalLessons} ${t("hero.completeLabel")}`}
          />
        </ReferenceCard>
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

/**
 * Compact horizontal progress bar for the hero. A slim accent-filled track
 * with a small caption + percentage underneath — keeps the hero card short
 * (the old large ring forced extra height). Server-rendered, no interactivity.
 */
function HeroProgress({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="mt-5 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-dark-cta transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-p4 text-white/70">{label}</span>
        <span className="text-p4 tabular-nums text-white/70">{pct}%</span>
      </div>
    </div>
  );
}

export const metadata = { title: "Academy" };
